export const PLATFORM_FEE_PERCENT_FREE = 20;
export const PLATFORM_FEE_PERCENT_PRO = 0;
export const MINIMUM_PAYOUT_CENTS = 2500;
export const MINIMUM_TIP_CENTS = 500;
export const CARD_W = 360;
export const CARD_H = 480;

// Referral System Milestones (5, 15, 25)
export const REFERRAL_MILESTONES = [
  { count: 5, months: 1, days: 30, label: "1 Month Pro Free", badge: false },
  { count: 15, months: 3, days: 90, label: "3 Months Pro Free + Gold Badge", badge: true },
  { count: 25, months: 6, days: 180, label: "6 Months Pro Free", badge: true },
];

export const MAX_REFERRAL_PRO_DAYS = 365; // 12 Months Max Cap
export const REFERRAL_WINDOW_DAYS = 30;   // Cookie/attribution window
export const REFERRAL_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Disposable Email Domains Blacklist
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "temp-mail.org", "guerrillamail.com", "10minutemail.com",
  "trashmail.com", "yopmail.com", "sharklasers.com", "getairmail.com", "dispostable.com",
  "throwawaymail.com", "temp-mail.io", "burnermail.io", "fakeinbox.com", "maildrop.cc"
]);
