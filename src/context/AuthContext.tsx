import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '../firebase/config';

/**
 * HOW ACCOUNTS WORK (secure version)
 * - Firebase Authentication proves WHO the person is. No password check = no access.
 * - users/{uid}   : private profile (email, phone, documents). Owner + admin only.
 * - tutors/{uid}  : public tutor card (shown in the directory). Created by admin on approval.
 * - admins/{uid}  : admin list. Can ONLY be edited by you in the Firebase console.
 * - Roles/status/approval can never be set by the user themselves (enforced in firestore.rules).
 */

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  authLoading: boolean;
  login: (email: string, pass: string) => Promise<{
    success: boolean;
    error?: string;
    requiresEmailVerification?: boolean;
    unverifiedUser?: UserProfile;
  }>;
  signInWithGoogle: (options?: {
    preferredRole?: UserRole;
    mode?: 'login' | 'register';
  }) => Promise<{
    success: boolean;
    error?: string;
    user?: UserProfile;
    isNewUser?: boolean;
    googleProfile?: {
      email: string;
      fullName: string;
      photoURL?: string;
      phoneNumber?: string;
      uid: string;
    };
  }>;
  register: (userData: {
    fullName: string;
    email: string;
    password?: string;
    phoneNumber: string;
    role: UserRole;
    bio?: string;
    subjects?: string[];
    academicLevels?: string[];
    hourlyRatePula?: number;
    location?: string;
    qualifications?: string;
    university?: string;
    courseOrMajor?: string;
    collegeOrUniversity?: string;
    yearsOfExperience?: string;
    resumeDocUrl?: string;
    academicRecordDocUrl?: string;
    omangIdDocUrl?: string;
  }) => Promise<{ success: boolean; error?: string; user?: UserProfile; firebaseEmailSent?: boolean }>;
  resendVerificationEmail: (email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  checkEmailVerified: (email?: string) => Promise<{ verified: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => void;
  deleteUserByEmail: (email: string) => Promise<void>;
  isPhoneTaken: (phone: string, currentEmail?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------- helpers ----------

// Fields that are safe to show to everyone on a tutor's public card
const PUBLIC_TUTOR_KEYS = [
  'id', 'fullName', 'avatarUrl', 'joinedDate', 'role', 'status', 'isVerifiedTutor',
  'bio', 'qualifications', 'university', 'courseOrMajor', 'collegeOrUniversity',
  'yearsOfExperience', 'subjects', 'academicLevels', 'location', 'hourlyRatePula',
  'packages', 'rating', 'reviewCount'
];

// Fields a person may change on their OWN private profile (must match firestore.rules)
const OWNER_USER_KEYS = [
  'fullName', 'phoneNumber', 'avatarUrl', 'bio', 'qualifications', 'university',
  'courseOrMajor', 'collegeOrUniversity', 'yearsOfExperience', 'subjects', 'academicLevels',
  'location', 'hourlyRatePula', 'packages', 'verificationDocs', 'resumeDocUrl',
  'academicRecordDocUrl', 'omangIdDocUrl', 'emailVerified', 'studentIdDocUrl',
  'preferredPaymentMethod'
];

// Fields a verified tutor may change on their own PUBLIC card (must match firestore.rules)
const OWNER_TUTOR_KEYS = [
  'fullName', 'avatarUrl', 'bio', 'qualifications', 'university', 'courseOrMajor',
  'collegeOrUniversity', 'yearsOfExperience', 'subjects', 'academicLevels', 'location',
  'hourlyRatePula', 'packages'
];

const clean = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const pick = (obj: Record<string, any>, keys: string[]) => {
  const out: Record<string, any> = {};
  keys.forEach(k => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

const toPublicTutor = (u: UserProfile) => clean(pick(u as any, PUBLIC_TUTOR_KEYS));

const fromPublicTutor = (id: string, data: any): UserProfile =>
  ({ email: '', phoneNumber: '', ...data, id } as UserProfile);

const defaultAvatar = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

const MSG = {
  suspended: 'Your account has been suspended by LearnLink Admin. Please contact support@learnlink.co.bw.',
  pending:
    'Your tutor registration is currently pending admin verification and document review. Tutors cannot access the portal until approved.',
  noProfile:
    'We could not find a LearnLink profile for this account. Please choose "Join LearnLink" and register with the same email and password to finish setting up.',
  network: 'We could not reach LearnLink servers. Please check your internet connection and try again.',
  unavailable: 'Sign-in is not available right now. Please try again later.'
};

const authErrorMessage = (err: any): string => {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Incorrect email address or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes or reset your password, then try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support@learnlink.co.bw.';
    case 'auth/network-request-failed':
      return MSG.network;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Please allow pop-ups for this site and try again.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Please contact support.';
    default:
      return 'Sign-in failed. Please try again.';
  }
};

type Evaluation = {
  kind: 'ok' | 'no_profile' | 'suspended' | 'pending' | 'unverified';
  user?: UserProfile;
  profile?: UserProfile | null;
};

// ---------- provider ----------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [publicTutors, setPublicTutors] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  // While a login / register flow is running, the background session watcher stays quiet
  const busyRef = useRef(false);
  const currentUserRef = useRef<UserProfile | null>(null);
  const allUsersRef = useRef<UserProfile[]>([]);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);

  const isAdmin = currentUser?.role === 'admin';

  // Public tutor cards: visible to everyone (including visitors who are not logged in)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'tutors'),
      snap => {
        const list: UserProfile[] = [];
        snap.forEach(d => list.push(fromPublicTutor(d.id, d.data())));
        setPublicTutors(list);
      },
      err => console.warn('Could not load tutors:', err?.code || err)
    );
    return () => unsub();
  }, []);

  // Full user list: admin only (Firestore rules refuse everyone else)
  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'users'),
      snap => {
        const list: UserProfile[] = [];
        snap.forEach(d => list.push({ ...(d.data() as UserProfile), id: d.id }));
        setAllUsers(list);
      },
      err => console.warn('Could not load users:', err?.code || err)
    );
    return () => unsub();
  }, [isAdmin]);

  const users = useMemo<UserProfile[]>(() => {
    if (isAdmin) return allUsers;
    const others = publicTutors.filter(t => t.id !== currentUser?.id);
    return currentUser ? [...others, currentUser] : others;
  }, [isAdmin, allUsers, publicTutors, currentUser]);

  // ----- loading / checking an account -----

  const loadProfile = async (uid: string): Promise<UserProfile | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? ({ ...(snap.data() as UserProfile), id: uid }) : null;
  };

  const checkAdmin = async (uid: string): Promise<boolean> => {
    try {
      const snap = await getDoc(doc(db, 'admins', uid));
      return snap.exists();
    } catch {
      return false;
    }
  };

  const evaluate = async (fbUser: FirebaseUser): Promise<Evaluation> => {
    const [admin, profile] = await Promise.all([checkAdmin(fbUser.uid), loadProfile(fbUser.uid)]);

    if (admin) {
      const adminUser: UserProfile = {
        ...(profile || {}),
        id: fbUser.uid,
        email: fbUser.email || profile?.email || '',
        fullName: profile?.fullName || fbUser.displayName || 'LearnLink Admin',
        phoneNumber: profile?.phoneNumber || '',
        role: 'admin',
        status: 'active',
        avatarUrl: profile?.avatarUrl || fbUser.photoURL || defaultAvatar('LearnLink Admin'),
        joinedDate: profile?.joinedDate || '',
        emailVerified: true
      } as UserProfile;
      return { kind: 'ok', user: adminUser, profile };
    }

    if (!profile) return { kind: 'no_profile', profile: null };
    if (profile.status === 'suspended') return { kind: 'suspended', profile };
    if (profile.role === 'tutor' && (profile.status === 'pending_verification' || !profile.isVerifiedTutor)) {
      return { kind: 'pending', profile };
    }
    if (profile.role === 'student' && !fbUser.emailVerified) {
      return { kind: 'unverified', user: profile, profile };
    }
    return { kind: 'ok', user: { ...profile, emailVerified: fbUser.emailVerified }, profile };
  };

  const safeSignOut = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.warn('Sign-out notice:', e);
    }
  };

  // Restore the session when the page is reloaded
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (busyRef.current) {
        setAuthLoading(false);
        return;
      }
      if (!fbUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const ev = await evaluate(fbUser);
        if (busyRef.current) return;
        setCurrentUser(ev.kind === 'ok' ? ev.user! : null);
        if (ev.kind === 'suspended' || ev.kind === 'pending') await safeSignOut();
      } catch (e) {
        console.warn('Session check notice:', e);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // ----- login -----

  const login: AuthContextType['login'] = async (email, pass) => {
    if (!auth) return { success: false, error: MSG.unavailable };
    const cleanEmail = email.trim();
    if (!cleanEmail || !pass) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    busyRef.current = true;
    try {
      let fbUser: FirebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        fbUser = cred.user;
      } catch (err: any) {
        return { success: false, error: authErrorMessage(err) };
      }

      const ev = await evaluate(fbUser);
      switch (ev.kind) {
        case 'ok':
          setCurrentUser(ev.user!);
          return { success: true };
        case 'unverified':
          setCurrentUser(null);
          return { success: false, requiresEmailVerification: true, unverifiedUser: ev.user };
        case 'pending':
          await safeSignOut();
          return { success: false, error: MSG.pending };
        case 'suspended':
          await safeSignOut();
          return { success: false, error: MSG.suspended };
        default:
          await safeSignOut();
          return { success: false, error: MSG.noProfile };
      }
    } catch (e) {
      console.warn('Login notice:', e);
      return { success: false, error: MSG.network };
    } finally {
      busyRef.current = false;
    }
  };

  // ----- creating a profile -----

  const buildNewProfile = (
    uid: string,
    data: {
      fullName: string;
      email: string;
      phoneNumber: string;
      role: UserRole;
      bio?: string;
      subjects?: string[];
      academicLevels?: string[];
      hourlyRatePula?: number;
      location?: string;
      qualifications?: string;
      university?: string;
      courseOrMajor?: string;
      collegeOrUniversity?: string;
      yearsOfExperience?: string;
      resumeDocUrl?: string;
      academicRecordDocUrl?: string;
      omangIdDocUrl?: string;
      avatarUrl?: string;
      emailVerified?: boolean;
    }
  ): UserProfile => {
    const isTutor = data.role === 'tutor';
    const rate = data.hourlyRatePula || 150;
    return {
      id: uid,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phoneNumber: (data.phoneNumber || '').trim(),
      role: isTutor ? 'tutor' : 'student',
      status: isTutor ? 'pending_verification' : 'active',
      isVerifiedTutor: false,
      avatarUrl: data.avatarUrl || defaultAvatar(data.fullName),
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bio: data.bio || (isTutor ? `Tutor in ${data.courseOrMajor || 'General Subjects'} from ${data.collegeOrUniversity || data.university || 'University'}.` : ''),
      subjects: data.subjects || (isTutor ? ['Mathematics'] : []),
      academicLevels: data.academicLevels || (isTutor ? ['Secondary (BGCSE/IGCSE)'] : []),
      hourlyRatePula: rate,
      location: data.location || 'Gaborone',
      qualifications: data.qualifications || data.courseOrMajor || (isTutor ? 'Degree Candidate' : ''),
      university: data.collegeOrUniversity || data.university || '',
      courseOrMajor: data.courseOrMajor || '',
      collegeOrUniversity: data.collegeOrUniversity || data.university || '',
      yearsOfExperience: data.yearsOfExperience || '',
      packages: isTutor
        ? [
            { id: `pkg_${uid}_1`, name: 'Starter Pass (4 Sessions)', sessionCount: 4, pricePula: rate * 4 * 0.95 },
            { id: `pkg_${uid}_2`, name: 'Intensive Pass (8 Sessions)', sessionCount: 8, pricePula: rate * 8 * 0.88, isBestValue: true }
          ]
        : [],
      rating: 0,
      reviewCount: 0,
      totalEarningsPula: 0,
      activeStudentsCount: 0,
      pendingRequestsCount: 0,
      verificationDocs: isTutor
        ? [
            data.omangIdDocUrl ? `Omang/ID: ${data.omangIdDocUrl}` : 'Omang/ID: not provided',
            data.academicRecordDocUrl ? `Academic Record: ${data.academicRecordDocUrl}` : 'Academic Record: not provided',
            data.resumeDocUrl ? `Resume/CV: ${data.resumeDocUrl}` : 'Resume/CV: not provided'
          ]
        : [],
      resumeDocUrl: data.resumeDocUrl || '',
      academicRecordDocUrl: data.academicRecordDocUrl || '',
      omangIdDocUrl: data.omangIdDocUrl || '',
      emailVerified: !!data.emailVerified
    };
  };

  const isPhoneTaken = (_phone: string, _currentEmail?: string) => {
    // Checking other people's phone numbers needs a server; private profiles are not readable by others.
    return false;
  };

  // ----- Google -----

  const signInWithGoogle: AuthContextType['signInWithGoogle'] = async options => {
    if (!auth) return { success: false, error: MSG.unavailable };

    busyRef.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const cleanEmail = (fbUser.email || '').trim().toLowerCase();

      if (!cleanEmail) {
        await safeSignOut();
        return { success: false, error: 'No email address found in this Google Account.' };
      }

      const preferredRole = options?.preferredRole || 'student';
      const authMode = options?.mode || 'login';
      const ev = await evaluate(fbUser);

      // ---- Sign-in mode ----
      if (authMode === 'login') {
        if (ev.kind === 'ok') {
          setCurrentUser(ev.user!);
          return { success: true, user: ev.user, isNewUser: false };
        }
        await safeSignOut();
        if (ev.kind === 'suspended') return { success: false, error: MSG.suspended };
        if (ev.kind === 'pending') return { success: false, error: MSG.pending };
        return {
          success: false,
          error: `No LearnLink account registered with ${cleanEmail}. Please switch to "Join LearnLink" to create your account.`
        };
      }

      // ---- Register mode ----
      if (ev.kind !== 'no_profile') {
        const existingRole = ev.profile?.role;
        await safeSignOut();
        if (existingRole && existingRole !== preferredRole) {
          return {
            success: false,
            error: `This Google account (${cleanEmail}) is already registered as a ${existingRole.toUpperCase()} on LearnLink. An account cannot be both a student and a tutor. Please sign in as a ${existingRole} or use a different Google account.`
          };
        }
        return {
          success: false,
          error: `An account for ${cleanEmail} already exists. Please switch to the Sign In tab to log in.`
        };
      }

      if (preferredRole === 'tutor') {
        // Tutors must finish the application form (and be approved) before getting access.
        return {
          success: true,
          isNewUser: true,
          googleProfile: {
            email: cleanEmail,
            fullName: fbUser.displayName || cleanEmail.split('@')[0],
            photoURL: fbUser.photoURL || '',
            phoneNumber: fbUser.phoneNumber || '',
            uid: fbUser.uid
          }
        };
      }

      // New student via Google
      const newUser = buildNewProfile(fbUser.uid, {
        fullName: fbUser.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        phoneNumber: fbUser.phoneNumber || '',
        role: 'student',
        avatarUrl: fbUser.photoURL || undefined,
        emailVerified: true
      });
      try {
        await setDoc(doc(db, 'users', fbUser.uid), clean(newUser));
      } catch (e) {
        console.warn('Could not save student profile:', e);
        await safeSignOut();
        return { success: false, error: 'We could not create your profile. Please try again in a moment.' };
      }
      setCurrentUser(newUser);
      return { success: true, user: newUser, isNewUser: true };
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.code || err);
      return { success: false, error: authErrorMessage(err) };
    } finally {
      busyRef.current = false;
    }
  };

  // ----- register (email + password, or finishing a Google tutor application) -----

  const register: AuthContextType['register'] = async data => {
    if (!auth) return { success: false, error: MSG.unavailable };

    const cleanEmail = data.email.trim().toLowerCase();
    const role: UserRole = data.role === 'tutor' ? 'tutor' : 'student';

    busyRef.current = true;
    try {
      let fbUser: FirebaseUser | null = null;
      let firebaseEmailSent = false;

      if (auth.currentUser && (auth.currentUser.email || '').toLowerCase() === cleanEmail) {
        // Already signed in with Google for this same email (tutor application flow)
        fbUser = auth.currentUser;
      } else {
        if (!data.password || data.password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters.' };
        }
        try {
          const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
          fbUser = cred.user;
          try {
            await sendEmailVerification(fbUser);
            firebaseEmailSent = true;
          } catch (emailErr: any) {
            console.warn('Verification email notice:', emailErr?.code || emailErr?.message);
          }
        } catch (fbErr: any) {
          if (fbErr?.code === 'auth/email-already-in-use') {
            // Account exists. If the password is right and no profile was ever saved, finish setting it up.
            try {
              const cred = await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
              fbUser = cred.user;
            } catch {
              return {
                success: false,
                error: `An account for ${cleanEmail} already exists on LearnLink. Please switch to the Sign In tab to log in.`
              };
            }
          } else {
            return { success: false, error: authErrorMessage(fbErr) };
          }
        }
      }

      if (!fbUser) return { success: false, error: 'Could not create your account. Please try again.' };

      const existing = await loadProfile(fbUser.uid);
      if (existing) {
        await safeSignOut();
        if (existing.role !== role) {
          return {
            success: false,
            error: `This email (${cleanEmail}) is already registered as a ${existing.role.toUpperCase()} on LearnLink. An account cannot be both a student and a tutor. Please sign in as a ${existing.role} or use a different email.`
          };
        }
        return {
          success: false,
          error: `An account for ${cleanEmail} already exists on LearnLink. Please switch to the Sign In tab to log in.`
        };
      }

      const newUser = buildNewProfile(fbUser.uid, {
        ...data,
        role,
        avatarUrl: undefined,
        emailVerified: fbUser.emailVerified
      });

      try {
        await setDoc(doc(db, 'users', fbUser.uid), clean(newUser));
      } catch (e) {
        console.warn('Could not save profile:', e);
        return {
          success: false,
          error: 'Your sign-in was created but we could not save your profile. Please press Register again with the same email and password.'
        };
      }

      // Tutors wait for approval, so they are signed out. Students stay signed in to confirm their email.
      if (role === 'tutor') await safeSignOut();

      return { success: true, user: newUser, firebaseEmailSent };
    } catch (e) {
      console.warn('Register notice:', e);
      return { success: false, error: MSG.network };
    } finally {
      busyRef.current = false;
    }
  };

  // ----- email verification and password reset -----

  const resendVerificationEmail: AuthContextType['resendVerificationEmail'] = async email => {
    try {
      if (auth && auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return {
          success: true,
          message: `Verification email resent to ${auth.currentUser.email || email}. Please check your inbox and spam folder.`
        };
      }
      return {
        success: false,
        error: 'Unable to resend: no active session. Please sign in again to get a new verification email.'
      };
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        return { success: false, error: 'Please wait a moment before requesting another email.' };
      }
      return { success: false, error: err?.message || 'Failed to send the verification email.' };
    }
  };

  const checkEmailVerified: AuthContextType['checkEmailVerified'] = async () => {
    try {
      if (!auth || !auth.currentUser) {
        return { verified: false, error: 'No active session found.' };
      }
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) return { verified: false };

      const ev = await evaluate(auth.currentUser);
      if (ev.kind === 'ok') {
        setCurrentUser(ev.user!);
        // Keep the private profile's flag in step (harmless if refused)
        setDoc(doc(db, 'users', auth.currentUser.uid), { emailVerified: true }, { merge: true }).catch(() => {});
        return { verified: true };
      }
      return { verified: false };
    } catch (err: any) {
      return { verified: false, error: err?.message };
    }
  };

  const resetPassword: AuthContextType['resetPassword'] = async email => {
    if (!auth) return { success: false, error: MSG.unavailable };
    const clean = email.trim();
    if (!clean) return { success: false, error: 'Please enter your email address.' };
    try {
      await sendPasswordResetEmail(auth, clean);
    } catch (err: any) {
      // Do not reveal whether an account exists
      if (err?.code === 'auth/network-request-failed') return { success: false, error: MSG.network };
      if (err?.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many requests. Please wait a few minutes and try again.' };
      }
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    safeSignOut();
  };

  // ----- profile updates (rules decide what is really allowed) -----

  const updateUserProfile = (id: string, updates: Partial<UserProfile>) => {
    const me = currentUserRef.current;
    if (!me) return;

    const iAmAdmin = me.role === 'admin';
    const isOwner = me.id === id && !iAmAdmin;
    const base = iAmAdmin ? allUsersRef.current.find(u => u.id === id) : isOwner ? me : undefined;

    // Update what this person sees right away
    if (me.id === id) setCurrentUser(prev => (prev ? { ...prev, ...updates } : prev));
    if (iAmAdmin) setAllUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));

    // Only the owner (own safe fields) or an admin can save to the database
    if (!iAmAdmin && !isOwner) return;

    const privatePayload = iAmAdmin ? clean(updates) : clean(pick(updates as any, OWNER_USER_KEYS));
    if (Object.keys(privatePayload).length > 0) {
      setDoc(doc(db, 'users', id), privatePayload, { merge: true }).catch(err =>
        console.warn('Profile save notice:', err?.code || err)
      );
    }

    // Keep the public tutor card in step
    const merged = base ? ({ ...base, ...updates } as UserProfile) : null;
    if (merged && merged.role === 'tutor') {
      const shouldBePublic = merged.isVerifiedTutor === true && merged.status === 'active';
      if (shouldBePublic) {
        const publicPayload = iAmAdmin
          ? toPublicTutor(merged)
          : clean(pick(updates as any, OWNER_TUTOR_KEYS));
        if (Object.keys(publicPayload).length > 0) {
          setDoc(doc(db, 'tutors', id), publicPayload, { merge: true }).catch(err =>
            console.warn('Public profile save notice:', err?.code || err)
          );
        }
      } else if (iAmAdmin) {
        deleteDoc(doc(db, 'tutors', id)).catch(err => console.warn('Public profile removal notice:', err?.code || err));
      }
    }
  };

  const deleteUserByEmail = async (email: string) => {
    const me = currentUserRef.current;
    if (!me || me.role !== 'admin') return;
    const cleanEmail = email.trim().toLowerCase();
    const found = allUsersRef.current.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (!found) return;
    try {
      await deleteDoc(doc(db, 'users', found.id));
      await deleteDoc(doc(db, 'tutors', found.id));
    } catch (e) {
      console.warn('Delete notice:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        authLoading,
        login,
        signInWithGoogle,
        register,
        resendVerificationEmail,
        checkEmailVerified,
        resetPassword,
        logout,
        updateUserProfile,
        deleteUserByEmail,
        isPhoneTaken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
