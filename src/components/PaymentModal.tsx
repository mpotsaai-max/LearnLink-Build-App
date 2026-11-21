import React, { useState } from 'react';
import { X, CheckCircle2, Info, AlertCircle, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { freePeriodEndText } from '../config';

// Free launch period version: this screen only sends a session REQUEST.
// No money, PINs or ID documents are collected, and LearnLink holds no payments.

interface PaymentModalProps {
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  subject: string;
  academicLevel: string;
  hourlyRatePula: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  tutorId,
  tutorName,
  tutorAvatar,
  subject,
  academicLevel,
  hourlyRatePula,
  onSuccess,
  onClose
}) => {
  const { createBooking } = useApp();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [hours, setHours] = useState(1.5);
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [timeStr, setTimeStr] = useState('15:00 - 16:30');
  const [meetingMode, setMeetingMode] = useState<'Online' | 'In-person'>('Online');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [errorMessage, setErrorMessage] = useState('');

  const estimatedPricePula = Math.round(hourlyRatePula * hours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Please sign in to request a session.');
      return;
    }
    if (!dateStr || dateStr < todayStr) {
      setErrorMessage('Please choose a date that is today or later.');
      return;
    }
    setErrorMessage('');

    const res = createBooking({
      tutorId,
      tutorName,
      tutorAvatar,
      subject,
      academicLevel,
      date: dateStr,
      time: timeStr,
      durationHours: hours,
      pricePula: estimatedPricePula,
      meetingMode,
      notes
    });

    if (res.success) {
      setStep('success');
    } else {
      setErrorMessage(res.error || 'We could not send your request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-bold text-xl text-[#022448]">Request a Session</h3>
              <p className="text-xs text-slate-500 mt-1">
                {subject} with <strong>{tutorName}</strong> ({academicLevel})
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong className="font-bold">Free launch period (until {freePeriodEndText()}).</strong> LearnLink does not hold or process any payment. After you send this request, agree the time and payment directly with your tutor.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time</label>
                <select
                  value={timeStr}
                  onChange={e => setTimeStr(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="09:00 - 10:30">09:00 - 10:30 AM</option>
                  <option value="11:00 - 12:30">11:00 - 12:30 PM</option>
                  <option value="15:00 - 16:30">15:00 - 16:30 PM</option>
                  <option value="17:00 - 18:30">17:00 - 18:30 PM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Length</label>
                <select
                  value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Where</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Online', 'In-person'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMeetingMode(m)}
                      className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                        meetingMode === m
                          ? 'bg-[#022448] text-white border-[#022448]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {meetingMode === 'In-person' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  For your safety, meet in a public place. Students under 18 should have a parent or guardian present or informed.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes for your tutor (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Topics you want help with, your exam date, anything useful..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Estimated price at the tutor&apos;s rate:</span>
              <span className="text-lg font-black text-[#022448]">P{estimatedPricePula}.00</span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-3">
              This is only an estimate. The final price and how to pay are agreed directly with your tutor.
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-semibold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#feae2c] text-[#022448] font-bold text-sm rounded-xl shadow-md hover:bg-[#f09c13] transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Request
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h4 className="font-bold text-2xl text-[#022448]">Request Sent</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your request for <strong>{subject}</strong> with <strong>{tutorName}</strong> on{' '}
              <strong>{dateStr}</strong> ({timeStr}) has been sent. Your tutor will accept or suggest another time.
              Agree the final price and how to pay directly with your tutor. LearnLink does not hold any payment.
            </p>
            <button
              onClick={onSuccess}
              className="px-6 py-3 bg-[#022448] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#1e3a5f] transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
