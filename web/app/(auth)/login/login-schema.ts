import { z } from 'zod';

// E.164 phone number regex
const E164_PHONE_REGEX = /^\+[1-9]\d{7,15}$/;

// Validate phone number in E.164 format or Kenya local format (9 digits)
const validatePhoneNumber = (phone: string): boolean => {
  // Strip all whitespace before validation
  const normalized = phone.replace(/\s+/g, '');

  // If it starts with +, validate as full E.164 format
  if (normalized.startsWith('+')) {
    return E164_PHONE_REGEX.test(normalized);
  }

  // If it doesn't start with +, validate as Kenya local format (9 digits)
  // When prefixed with +254, it should create a valid E.164 number
  if (!/^\d{9}$/.test(normalized)) {
    return false;
  }

  // Verify that +254{phone} would be valid E.164
  return E164_PHONE_REGEX.test(`+254${normalized}`);
};

// Function to create schemas with translated messages
export const createEmailLoginSchema = (t: (key: string) => string) =>
  z.object({
    loginType: z.literal('email'),
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(1, t('passwordRequired')),
  });

// Default schema for type inference
export const emailLoginSchema = z.object({
  loginType: z.literal('email'),
  email: z.string().email(),
  password: z.string().min(1),
});

export type EmailLogin = z.infer<typeof emailLoginSchema>;

// Phone login base schema
const phoneLoginBaseSchema = z.object({
  loginType: z.literal('phone'),
  phone: z.string().optional(),
  otp_code: z.string().optional(),
  request_id: z.string().optional(),
});

// Function to create phone login schema with translated messages
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
      } else if (!validatePhoneNumber(data.phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: t('invalidPhoneFormat'),
        });
      }
    }
  });

// Default schema for type inference
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
      } else if (!validatePhoneNumber(data.phone)) {
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

export const loginSchema = z.object({
  email: z.string().nonempty().email(),
  password: z.string().nonempty(),
});

export type Login = z.infer<typeof loginSchema>;
