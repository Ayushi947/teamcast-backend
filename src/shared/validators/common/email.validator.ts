import { z } from 'zod';

// List of common personal email domains that should be rejected
const PERSONAL_EMAIL_DOMAINS = [
  // Most common personal email providers
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',

  // International providers
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'rediffmail.com',
  'yandex.ru',
  'mail.ru',
  'gmx.com',
  'gmx.net',
  'web.de',
  'protonmail.com',
  'proton.me',
  'tutanota.com',
  'zoho.com',

  // Other common personal providers
  'ymail.com',
  'rocketmail.com',
  'inbox.com',
  'mail.com',
  'email.com',
  'usa.com',
  'fastmail.com',
  'hushmail.com',
  'lycos.com',
  'excite.com',
  'comcast.net',
  'verizon.net',
  'att.net',
  'sbcglobal.net',
  'bellsouth.net',
  'cox.net',
  'earthlink.net',
  'charter.net',
  'shaw.ca',
  'rogers.com',
  'optonline.net',
  'frontier.com',
  'windstream.net',

  // Temporary/Disposable email providers
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'tempmail.com',
  'maildrop.cc',
  'dispostable.com',
  'jetable.org',
  'trashmail.com',
];

/**
 * Custom validator for business email addresses
 * Rejects personal email providers and disposable email services
 */
export const businessEmailValidator = z
  .string()
  .email({ message: 'Invalid email address format' })
  .max(255, { message: 'Email must be at most 255 characters long' })
  .refine(
    (email) => {
      const domain = email.toLowerCase().split('@')[1];
      return !PERSONAL_EMAIL_DOMAINS.includes(domain);
    },
    {
      message:
        'Please use a business email address. Personal email providers (Gmail, Yahoo, Hotmail, etc.) are not accepted.',
    }
  );

/**
 * Standard email validator for general use
 * Accepts any valid email format
 */
export const standardEmailValidator = z
  .string()
  .email({ message: 'Invalid email address format' })
  .max(255, { message: 'Email must be at most 255 characters long' });
