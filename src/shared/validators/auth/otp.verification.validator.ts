import { z } from 'zod';

export const sendOtpVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});
