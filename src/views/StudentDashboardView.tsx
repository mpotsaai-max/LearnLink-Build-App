import { CONTACT } from '../config';
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  ArrowRight,
  UserCheck,
  CreditCard,
  FileText,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { RatingModal } from '../components/RatingModal';
import { PaymentMethod } from '../types';

interface StudentDashboardViewProps {
  onNavigate: (tab: string) => void;
  onSelectTutor: (tutorId: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate, onSelectTutor }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const { sessions, transactions, rescheduleSession, setActiveChatUser, setActiveDailySession } = useApp();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'escrow_transactions' | 'settings'>('upcoming');
  const [selectedRatingSession, setSelectedRatingSession] = useState<{
    id: string;
    tutorId: string;
    tutorName: string;
    subject: string;
  } | null>(null);

  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('15:00 - 16:30');

  // Student Settings Form State
  const [studentIdFile, setStudentIdFile] = useState(currentUser?.studentIdDocUrl || '');
  const [preferredPayMethod, setPreferredPayMethod] = useState<PaymentMethod>(
    currentUser?.preferredPaymentMethod || 'OrangeMoney'
  );
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  if (!currentUser) return null;

  const mySessions = sessions.filter(s => s.studentId === currentUser.id);
  const upcomingSessions = mySessions.filter(s => s.status === 'accepted' || s.status === 'pending');
  const pastSessions = mySessions.filter(s => s.status === 'completed');

  const myTransactions = transactions.filter(t => t.studentId === currentUser.id);
  const totalEscrowPula = myTransactions.reduce((acc, t) => t.status === 'escrow_held' ? acc + t.amountPula : acc, 0);

  const handleSaveStudentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdFile.trim()) {
      alert('Please attach your National Omang / Student ID PDF or image file.');
      return;
    }
    updateUserProfile(currentUser.id, {
      studentIdDocUrl: studentIdFile.trim(),
      preferredPaymentMethod: preferredPayMethod
    });
    setSettingsSavedMsg('Student verification prerequisites updated successfully!');
    setTimeout(() => setSettingsSavedMsg(''), 3000);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rescheduleSessionId && newDate) {
      rescheduleSession(rescheduleSessionId, newDate, newTime);
      setRescheduleSessionId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-[#022448] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#feae2c]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Dumela, {currentUser.fullName}!</h1>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              Student Dashboard • {currentUser.email} • Mobile: {currentUser.phoneNumber}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('tutors')}
          className="px-6 py-3 bg-[#feae2c] text-[#022448] font-bold text-xs sm:text-sm rounded-xl hover:bg-[#f09c13] transition-all shadow-md flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Book New Tutor
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#022448] font-bold flex items-center justify-center">
            <Calendar className="w-6 h-6 text-[#022448]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Upcoming Sessions</span>
            <span className="text-2xl font-black text-[#022448]">{upcomingSessions.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 font-bold flex items-center justify-center">
            <Clock className="w-6 h-6 text-[#feae2c]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Sessions</span>
            <span className="text-2xl font-black text-[#022448]">{pastSessions.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-900 font-bold flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sessions</span>
            <span className="text-2xl font-black text-[#022448]">{mySessions.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-900 font-bold flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Learner Status</span>
            <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mt-0.5">Active Student</span>
          </div>
        </div>

      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'border-[#022448] text-[#022448]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" /> Upcoming & Pending ({upcomingSessions.length})
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'past'
                ? 'border-[#022448] text-[#022448]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Past & Completed ({pastSessions.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-[#022448] text-[#022448]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#feae2c]" /> Account & Privacy
          </button>
        </div>

        {/* Tab 1: Upcoming Sessions */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p>You have no upcoming tutoring sessions scheduled.</p>
                <button
                  onClick={() => onNavigate('tutors')}
                  className="px-4 py-2 bg-[#022448] text-white font-bold text-xs rounded-xl"
                >
                  Browse Tutors
                </button>
              </div>
            ) : (
              upcomingSessions.map(session => (
                <div
                  key={session.id}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={session.tutorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                      alt={session.tutorName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#022448]"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#022448]">{session.subject}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                          session.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {session.status === 'accepted' ? 'Confirmed' : 'Pending Acceptance'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        Tutor: <strong>{session.tutorName}</strong> • {session.date} ({session.time})
                      </p>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mode: {session.meetingMode} • Estimated price: P{session.pricePula} (paid directly to your tutor)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {session.status === 'accepted' && session.videoCallUrl && (
                      <button
                        onClick={() => setActiveDailySession({
                          sessionId: session.id,
                          subject: session.subject,
                          tutorName: session.tutorName,
                          studentName: session.studentName,
                          videoCallUrl: session.videoCallUrl,
                          pricePula: session.pricePula
                        })}
                        className="px-4 py-2 bg-[#022448] text-white font-bold text-xs rounded-xl hover:bg-[#1e3a5f] flex items-center gap-1.5 shadow-md transition-transform hover:scale-[1.02]"
                      >
                        <Video className="w-4 h-4 text-[#feae2c]" /> Launch Daily.co Classroom
                      </button>
                    )}

                    <button
                      onClick={() => setRescheduleSessionId(session.id)}
                      className="px-3 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                    </button>

                    <button
                      onClick={() => setActiveChatUser({ id: session.tutorId, name: session.tutorName, avatar: session.tutorAvatar })}
                      className="px-3 py-2 bg-blue-50 text-[#022448] font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Past Sessions */}
        {activeTab === 'past' && (
          <div className="space-y-4">
            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No completed sessions logged yet.</p>
            ) : (
              pastSessions.map(session => (
                <div
                  key={session.id}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={session.tutorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                      alt={session.tutorName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#022448]"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#022448]">{session.subject}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 uppercase">
                          Completed
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        Tutor: <strong>{session.tutorName}</strong> • Completed on {session.date}
                      </p>

                      {session.reviewGiven && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-xl mt-2 border border-amber-200 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#feae2c] text-[#feae2c] shrink-0" />
                          <span>Rated {session.ratingGiven}/5: &quot;{session.reviewGiven}&quot;</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {!session.ratingGiven && (
                    <button
                      onClick={() => setSelectedRatingSession({
                        id: session.id,
                        tutorId: session.tutorId,
                        tutorName: session.tutorName,
                        subject: session.subject
                      })}
                      className="px-4 py-2 bg-[#feae2c] text-[#022448] font-bold text-xs rounded-xl hover:bg-[#f09c13] flex items-center gap-1 shadow-sm"
                    >
                      <Star className="w-4 h-4 fill-[#022448]" /> Leave Review & Rating
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Account & Privacy */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#022448] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Your account.</strong> LearnLink only keeps the details needed to run your account and bookings (name, email and phone number). We do not ask students for ID documents, bank details or Mobile Money PINs.
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <p><strong>Name:</strong> {currentUser.fullName}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Phone:</strong> {currentUser.phoneNumber || 'Not provided'}</p>
            </div>
            <p>
              To see, correct or delete your information, contact us on{' '}
              <a href={CONTACT.whatsappLink} target="_blank" rel="noopener noreferrer" className="font-bold text-[#022448] underline">{CONTACT.phoneDisplay}</a>{' '}
              (call or WhatsApp) or at {CONTACT.email}.
            </p>
          </div>
        )}

      </div>

      {/* Reschedule Modal */}
      {rescheduleSessionId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-[#022448]">Reschedule Session</h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Time Slot</label>
                <select
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="09:00 - 10:30">09:00 - 10:30 AM</option>
                  <option value="11:00 - 12:30">11:00 - 12:30 PM</option>
                  <option value="15:00 - 16:30">15:00 - 16:30 PM</option>
                  <option value="17:00 - 18:30">17:00 - 18:30 PM</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleSessionId(null)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#022448] text-white font-bold text-xs rounded-xl"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {selectedRatingSession && (
        <RatingModal
          sessionId={selectedRatingSession.id}
          tutorId={selectedRatingSession.tutorId}
          tutorName={selectedRatingSession.tutorName}
          subject={selectedRatingSession.subject}
          onClose={() => setSelectedRatingSession(null)}
        />
      )}

    </div>
  );
};
