import bcrypt from 'bcrypt';
import crypto from 'crypto';

// generate a cryptographically secure random password
export const generatePassword = (length: number = 16): string => {
  // Define character sets for password generation
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Combine all character sets
  const allChars = lowercase + uppercase + numbers + symbols;

  // Ensure password has at least one character from each set
  let password = '';
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill the rest of the password length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};

// generate a simple alphanumeric password (for cases where special chars aren't allowed)
export const generateSimplePassword = (length: number = 16): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[crypto.randomInt(chars.length)];
  }

  return password;
};

// generate a secure token (for password reset, etc.)
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// hash a password
export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};

// compare a password with a hash
export const comparePassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

// check if a new password is different from the current password
export const isPasswordDifferent = async (
  newPassword: string,
  currentPasswordHash: string
): Promise<boolean> => {
  return !(await comparePassword(newPassword, currentPasswordHash));
};
