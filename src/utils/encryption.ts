import crypto from 'crypto';
import { ENV } from '@/config/env';

/**
 * Encryption utility for sensitive data like integration credentials
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly KEY_LENGTH = 32; // 256 bits

  /**
   * Derives encryption key from base secret and salt
   */
  private static deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      ENV.JWT_SECRET, // Use JWT_SECRET as base key
      salt,
      100000, // iterations
      this.KEY_LENGTH,
      'sha512'
    );
  }

  /**
   * Encrypts sensitive data
   * @param data - Object containing sensitive data
   * @returns Encrypted string with format: salt:iv:tag:encryptedData
   */
  static encrypt(data: Record<string, any>): string {
    try {
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const key = this.deriveKey(salt);

      const cipher = crypto.createCipheriv(
        this.ALGORITHM,
        key,
        iv
      ) as crypto.CipherGCM;

      const plaintext = JSON.stringify(data);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Format: salt:iv:tag:encryptedData
      return [
        salt.toString('hex'),
        iv.toString('hex'),
        tag.toString('hex'),
        encrypted,
      ].join(':');
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypts sensitive data
   * @param encryptedData - Encrypted string with format: salt:iv:tag:encryptedData
   * @returns Decrypted object
   */
  static decrypt<T = Record<string, any>>(encryptedData: string): T {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }

      const [saltHex, ivHex, tagHex, encrypted] = parts;

      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const key = this.deriveKey(salt);

      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        key,
        iv
      ) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted) as T;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validates if a string is encrypted data
   * @param data - String to validate
   * @returns true if string appears to be encrypted data
   */
  static isEncrypted(data: string): boolean {
    if (typeof data !== 'string') return false;
    const parts = data.split(':');
    return (
      parts.length === 4 && parts.every((part) => /^[a-f0-9]+$/i.test(part))
    );
  }

  /**
   * Encrypts credentials for integration storage
   * @param credentials - Dynamic credentials object
   * @returns Encrypted credentials string
   */
  static encryptCredentials(credentials: Record<string, any>): string {
    return this.encrypt(credentials);
  }

  /**
   * Decrypts credentials from integration storage
   * @param encryptedCredentials - Encrypted credentials string
   * @returns Decrypted credentials object
   */
  static decryptCredentials<T = Record<string, any>>(
    encryptedCredentials: string
  ): T {
    return this.decrypt<T>(encryptedCredentials);
  }
}
