import React, { useState } from 'react';
import { ShieldCheck, X, FileText, Lock, Scale, CheckCircle, Download, BookOpen } from 'lucide-react';
import { CONTACT, freePeriodEndText, TERMS_UPDATED } from '../config';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'fee' | 'tutor' | 'privacy';
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-1.5">
    <h4 className="font-bold text-slate-900 text-base">{title}</h4>
    <div className="text-xs text-slate-700 leading-relaxed space-y-2">{children}</div>
  </div>
);

const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, defaultTab = 'general' }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'fee' | 'tutor' | 'privacy'>(defaultTab);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const tabClass = (t: string) =>
    `px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
      activeTab === t ? 'bg-[#022448] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#022448] text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#feae2c] flex items-center justify-center text-[#022448] font-bold shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">LearnLink Terms &amp; Privacy</h2>
              <p className="text-xs text-blue-200">
                Terms of Service, Free Launch Period, Tutor Code of Conduct &amp; Privacy Policy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap gap-1 sm:gap-2">
          <button onClick={() => setActiveTab('general')} className={tabClass('general')}>
            <FileText className="w-3.5 h-3.5" /> 1. Platform Terms
          </button>
          <button onClick={() => setActiveTab('fee')} className={tabClass('fee')}>
            <Lock className="w-3.5 h-3.5" /> 2. Fees &amp; Free Launch Period
          </button>
          <button onClick={() => setActiveTab('tutor')} className={tabClass('tutor')}>
            <Scale className="w-3.5 h-3.5" /> 3. Tutor Code of Conduct
          </button>
          <button onClick={() => setActiveTab('privacy')} className={tabClass('privacy')}>
            <BookOpen className="w-3.5 h-3.5" /> 4. Privacy &amp; Data Protection
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-left">
          <p className="text-[11px] text-slate-400">
            Last updated: {TERMS_UPDATED}. Governed by the laws of the Republic of Botswana.
          </p>

          {activeTab === 'general' && (
            <div className="space-y-5">
              <Section title="1. What LearnLink is">
                <p>
                  LearnLink is an online platform that helps students (and their parents or guardians) find and contact independent tutors in Botswana. LearnLink is not a school and does not itself teach. Tutors are independent people, not employees or agents of LearnLink, and they decide how they teach.
                </p>
              </Section>

              <Section title="2. What “approved tutor” means">
                <p>
                  Before a tutor appears on the site, LearnLink reviews the identity and qualification documents the tutor submits and decides whether to approve the account. This is a document review only. It is not a police or criminal background check, and it is not a guarantee of a tutor&apos;s teaching quality, conduct or safety. Please use your own judgement, especially for children.
                </p>
              </Section>

              <Section title="3. Students under 18">
                <p>
                  If you are under 18, a parent or guardian must agree to these terms for you and should know about your lessons. We recommend that parents or guardians stay informed about every lesson. For in-person lessons, meet in a public place and, for children, have a parent or guardian present or nearby.
                </p>
              </Section>

              <Section title="4. Using the platform">
                <Bullets
                  items={[
                    'Give accurate information and keep your login private.',
                    'Be respectful. Harassment, abuse, discrimination or inappropriate messages lead to removal.',
                    'Do not upload forged, altered or someone else’s documents.',
                    'Do not use LearnLink for cheating, such as doing graded assignments or exams for a student.',
                    'We may suspend or close accounts that break these terms or put others at risk.',
                  ]}
                />
              </Section>

              <Section title="5. Payments">
                <p>
                  Payment is arranged directly between the student and the tutor. LearnLink does not hold, collect or process payments and is not a party to any payment arrangement. See the “Fees &amp; Free Launch Period” tab.
                </p>
              </Section>

              <Section title="6. Limits of our responsibility">
                <p>
                  LearnLink is provided “as is” and may sometimes be unavailable. We do not guarantee exam results, grades or admission outcomes, and we are not responsible for what happens during lessons or in meetings between users, including in-person meetings. To the extent allowed by the laws of Botswana, LearnLink is not liable for indirect or consequential losses. Nothing in these terms removes any right you have under Botswana law that cannot lawfully be excluded, or limits liability that cannot lawfully be limited.
                </p>
              </Section>

              <Section title="7. Changes and contact">
                <p>
                  We may update these terms. If a change is important, we will tell users on the site or by email. Questions or concerns: {CONTACT.phoneDisplay} (call or WhatsApp) or {CONTACT.email}.
                </p>
              </Section>
            </div>
          )}

          {activeTab === 'fee' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                <strong className="font-bold">LearnLink is free for students and tutors until {freePeriodEndText()}.</strong>
              </div>

              <Section title="1. During the free launch period">
                <Bullets
                  items={[
                    'LearnLink charges no fees to students or tutors.',
                    'LearnLink does not take payments. Students and tutors agree the price and how to pay directly with each other.',
                    'Keep your own record of what you agree. We suggest not paying large amounts in advance.',
                    'Never share bank PINs, Mobile Money PINs or passwords with anyone. LearnLink will never ask for them.',
                  ]}
                />
              </Section>

              <Section title="2. After the free launch period">
                <p>
                  We may introduce fees, for example a commission on bookings or optional paid promotion for tutors. We will announce any fee on the site and by email at least 30 days before it starts, and no fee will apply before then. If you do not agree with the new fees, you can close your account.
                </p>
              </Section>

              <Section title="3. Payment problems">
                <p>
                  Because LearnLink is not part of the payment, any payment disagreement is between the student and the tutor. If you contact us, we may help the two sides talk to each other, but we are not obliged to refund or resolve payments.
                </p>
              </Section>
            </div>
          )}

          {activeTab === 'tutor' && (
            <div className="space-y-5">
              <Section title="1. Applying and documents">
                <p>
                  To apply as a tutor you submit proof of identity (Omang or passport), proof of your qualifications and a CV. We use these only to check who you are and whether you hold the qualifications you claim, and only authorised LearnLink administrators can see them. By applying you consent to this review. See the Privacy tab for how long we keep them.
                </p>
                <p>
                  Submitting forged, altered or someone else&apos;s documents is a criminal matter. We will remove the account and may report it to the authorities.
                </p>
              </Section>

              <Section title="2. Approval">
                <p>
                  LearnLink decides whether to approve a tutor and may withdraw approval at any time, for example if information turns out to be false or if there are conduct concerns.
                </p>
              </Section>

              <Section title="3. Code of conduct">
                <Bullets
                  items={[
                    'Be on time and prepared, and cancel in good time if you cannot attend.',
                    'Keep your profile honest: your qualifications, experience, subjects and rate.',
                    'Treat every learner with respect. No harassment, bullying or discrimination.',
                    'Protect children. Keep messages to lesson matters, never ask for personal photos or private meetings, and do not be alone with a child in a private place. For in-person lessons, meet in a public place or with a parent or guardian present.',
                    'Keep learners’ personal information private and use it only for the lessons.',
                    'Help students learn. Do not complete graded assignments, tests or exams for them.',
                    'Report any safety concern to LearnLink straight away.',
                  ]}
                />
              </Section>

              <Section title="4. Rates and payment">
                <p>
                  You set your own rate and agree payment directly with students. See the “Fees &amp; Free Launch Period” tab for the free launch period and for future fees.
                </p>
              </Section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950">
                This policy explains how LearnLink handles personal information under Botswana&apos;s Data Protection Act, 2024.
              </div>

              <Section title="1. Who is responsible">
                <p>
                  LearnLink decides how and why your information is used (the “data controller”). Contact us about your information: {CONTACT.phoneDisplay} (call or WhatsApp) or {CONTACT.email}. We operate online.
                </p>
              </Section>

              <Section title="2. What we collect">
                <Bullets
                  items={[
                    <><strong>Everyone:</strong> name, email address, phone number, sign-in details, lesson requests and bookings, messages and reviews you send through the site.</>,
                    <><strong>Students:</strong> we do not ask for ID documents, bank details or Mobile Money details.</>,
                    <><strong>Tutors:</strong> also your Omang or passport, qualification documents, CV, profile details and photo.</>,
                    <><strong>Technical:</strong> basic technical data (such as device and browser type and IP address) handled by our hosting providers to run and secure the site.</>,
                  ]}
                />
              </Section>

              <Section title="3. Why we use it">
                <Bullets
                  items={[
                    'To create and run your account, and to pass lesson requests between students and tutors.',
                    'To review tutor applications and keep the platform safe (with your consent for tutor documents).',
                    'To prevent fraud and misuse, and to follow the law.',
                    'We do not sell your information and we do not use it for advertising or profiling.',
                  ]}
                />
              </Section>

              <Section title="4. Tutor documents">
                <p>
                  Only authorised LearnLink administrators can open tutor documents, and only to decide on your application. We delete the documents of rejected applicants within 30 days of the decision, and the documents of approved tutors within 90 days of approval. We keep only a record that you were approved (your name, the date and which documents were checked). You can ask us to delete them sooner.
                </p>
              </Section>

              <Section title="5. Children">
                <p>
                  Students under 18 use LearnLink with the permission of a parent or guardian. We collect only the details needed for bookings (name and contact details), and we do not use children&apos;s information for advertising or profiling. A parent or guardian can ask to see, correct or delete a child&apos;s information at any time.
                </p>
              </Section>

              <Section title="6. Who sees your information">
                <Bullets
                  items={[
                    'Tutors see the name and request details of students who contact them. Students see a tutor’s public profile (name, photo, subjects, rate, location and rating).',
                    'Service providers that help us run LearnLink: Google (Firebase, for sign-in and our database), Vercel (website hosting) and video meeting providers for online lessons.',
                    'Authorities, if the law requires us to share information.',
                  ]}
                />
              </Section>

              <Section title="7. Storing information outside Botswana">
                <p>
                  Our providers may store information on servers outside Botswana. We choose providers that protect data with security measures, and we only share what is needed to run the service.
                </p>
              </Section>

              <Section title="8. Security">
                <p>
                  Access to personal information is restricted by account login and by access rules in our database, and our providers encrypt data in transit and at rest. No online system is completely secure. If a breach affects your information, we will tell you and the Information and Data Protection Commission as the law requires.
                </p>
              </Section>

              <Section title="9. How long we keep it">
                <p>
                  We keep account information while your account is active and for up to 12 months after you close it, then delete or anonymise it. Tutor documents follow section 4.
                </p>
              </Section>

              <Section title="10. Your rights">
                <p>
                  You can ask to see the information we hold about you, correct it, delete it, limit how we use it, object to its use, receive a copy, or withdraw consent you gave us. We do not make automated decisions about you. Contact us using the details above and we will respond within the time set by law. If you are unhappy with our answer, you can complain to Botswana&apos;s Information and Data Protection Commission.
                </p>
              </Section>

              <Section title="11. Cookies and browser storage">
                <p>
                  We use your browser&apos;s storage only to keep you signed in and to make the site work. We do not use advertising cookies.
                </p>
              </Section>

              <Section title="12. Changes">
                <p>
                  If we change this policy in an important way, we will tell users on the site or by email.
                </p>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>LearnLink • Botswana</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors w-1/2 sm:w-auto"
            >
              <Download className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#022448] text-white hover:bg-[#1e3a5f] font-bold text-xs rounded-xl shadow-md transition-all w-1/2 sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
