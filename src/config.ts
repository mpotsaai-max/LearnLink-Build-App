// One place for details that appear across the site.
// Change them here and they update everywhere.

export const CONTACT = {
  address: 'Online',
  phoneDisplay: '+267 78 008 555',
  phoneTel: '+26778008555',
  whatsappLink: 'https://wa.me/26778008555',
  email: 'support@learnlink.co.bw'
};

// Free launch period: students pay tutors directly and LearnLink holds no money.
// Change this date to change when the free period ends (format YYYY-MM-DD).
export const FREE_PERIOD_END = '2027-02-21';

export const freePeriodEndText = () =>
  new Date(FREE_PERIOD_END + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

export const isFreePeriod = () => new Date() <= new Date(FREE_PERIOD_END + 'T23:59:59');

export const TERMS_UPDATED = '21 November 2026';
