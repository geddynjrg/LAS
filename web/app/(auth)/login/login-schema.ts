import {
  coercePhoneFormValue,
  isValidKenyanPhoneNumber,
} from '@/lib/utils/string';
import { z } from 'zod';

// Email Login Schemas
export const createEmailLoginSchema = (t: (key: string) => string) =>
  z.object({
    loginType: z.literal('email'),
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(1, t('passwordRequired')),
  });

export const emailLoginSchema = z.object({
  loginType: z.literal('email'),
  email: z.string().email(),
  password: z.string().min(1),
});

export type EmailLogin = z.infer<typeof emailLoginSchema>;

// Phone Login Schemas
const phoneLoginBaseSchema = z.object({
  loginType: z.literal('phone'),
  phone: z.preprocess(coercePhoneFormValue, z.string().optional()),
  otp_code: z.string().optional(),
  request_id: z.string().optional(),
});

export const createPhoneLoginSchema = (t: (key: string) => string) =>
  phoneLoginBaseSchema.superRefine((data, ctx) => {
    // OTP verification step - requires both OTP code and request ID
    if (data.otp_code && data.request_id) {
      if (!data.otp_code || data.otp_code.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otp_code'],
          message: t('invalidOtpFormat'),
        });
      }
      if (!data.request_id || data.request_id.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['request_id'],
          message: t('provideValidCredentials'),
        });
      }
    } else {
      // OTP request step - requires phone number and validates format
      if (!data.phone || data.phone.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: t('phoneNumberRequired'),
        });
      } else if (!isValidKenyanPhoneNumber(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: t('invalidPhoneFormat'),
        });
      }
    }
  });

export const phoneLoginSchema = phoneLoginBaseSchema.superRefine(
  (data, ctx) => {
    // OTP verification step - requires both OTP code and request ID
    if (data.otp_code && data.request_id) {
      if (!data.otp_code || data.otp_code.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['otp_code'],
          message: 'OTP code is required',
        });
      }
      if (!data.request_id || data.request_id.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['request_id'],
          message: 'Request ID is required',
        });
      }
    } else {
      // OTP request step - requires phone number and validates format
      if (!data.phone || data.phone.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Phone number is required',
        });
      } else if (!isValidKenyanPhoneNumber(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Please enter a valid phone number (9 digits)',
        });
      }
    }
  },
);

export type PhoneLogin = z.infer<typeof phoneLoginSchema>;

// eCitizen Login Schemas
export const ecitizenLoginSchema = z.object({
  loginType: z.literal('ecitizen'),
  state: z.string().optional(),
  code: z.string().optional(),
});

export type ECitizenLogin = z.infer<typeof ecitizenLoginSchema>;

// Legacy login schema (for backward compatibility)
export const loginSchema = z.object({
  email: z.string().nonempty().email(),
  password: z.string().nonempty(),
});

export type Login = z.infer<typeof loginSchema>;

// Union type for all login types
export type AnyLogin = EmailLogin | PhoneLogin | ECitizenLogin;
