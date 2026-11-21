import { UserProfile, BookingSession, PaymentTransaction, NotificationItem, ChatThread, ChatMessage, ReviewItem, SimulatedEmail } from '../types';

// Sample/demo data has been removed. LearnLink now starts empty and uses real accounts only.
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_SESSIONS: BookingSession[] = [];
export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [];
export const INITIAL_REVIEWS: ReviewItem[] = [];
export const INITIAL_CHATS: ChatThread[] = [];
export const INITIAL_MESSAGES: ChatMessage[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_EMAILS: SimulatedEmail[] = [];

export const SUBJECT_CATEGORIES = [
  { name: 'Mathematics', icon: 'Calculator', count: '18 Tutors', popular: true },
  { name: 'Physics & Science', icon: 'Atom', count: '14 Tutors', popular: true },
  { name: 'Chemistry & Biology', icon: 'FlaskConical', count: '12 Tutors', popular: true },
  { name: 'Computer Programming', icon: 'Code', count: '10 Tutors', popular: true },
  { name: 'English & Literature', icon: 'BookOpen', count: '15 Tutors', popular: false },
  { name: 'Accounting & Finance', icon: 'Landmark', count: '9 Tutors', popular: false },
  { name: 'Setswana Language', icon: 'Languages', count: '8 Tutors', popular: false },
  { name: 'Economics & Commerce', icon: 'TrendingUp', count: '7 Tutors', popular: false }
];

export const BOTSWANA_LOCATIONS = [
  'All Locations',
  'Gaborone (In-person & Online)',
  'Francistown (In-person & Online)',
  'Maun (Online Only)',
  'Palapye (In-person & Online)',
  'Lobatse (In-person)',
  'Remote / Online Only'
];

export const ACADEMIC_LEVELS = [
  'All Academic Levels',
  'Primary (PSLE)',
  'Secondary (Junior / BGCSE / IGCSE)',
  'Tertiary (University / College)',
  'Professional / ACCA / Adult'
];
