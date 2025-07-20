import { z } from "zod";

// Function to create schemas with translated messages
export const createEmailLoginSchema = (t: (key: string) => string) =>
  z.object({
    loginType: z.literal("email"),
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
  });

// Default schema for type inference
export const emailLoginSchema = z.object({
  loginType: z.literal("email"),
  email: z.string().email(),
  password: z.string().min(1),
});

export type EmailLogin = z.infer<typeof emailLoginSchema>;

// Phone login base schema
const phoneLoginBaseSchema = z.object({
  loginType: z.literal("phone"),
  phone: z.string().optional(),
  otp_code: z.string().optional(),
  request_id: z.string().optional(),
});

// Function to create phone login schema with translated messages
export const createPhoneLoginSchema = (t: (key: string) => string) =>
  phoneLoginBaseSchema.refine(
    (data) => {
      // OTP verification step - requires both OTP code and request ID
      if (data.otp_code && data.request_id) {
        return data.otp_code.length > 0 && data.request_id.length > 0;
      }
      // OTP request step - requires phone number
      return data.phone && data.phone.length > 0;
    },
    {
      message: t("provideValidCredentials"),
    },
  );

// Default schema for type inference
export const phoneLoginSchema = phoneLoginBaseSchema.refine((data) => {
  // OTP verification step - requires both OTP code and request ID
  if (data.otp_code && data.request_id) {
    return data.otp_code.length > 0 && data.request_id.length > 0;
  }
  // OTP request step - requires phone number
  return data.phone && data.phone.length > 0;
});

export type PhoneLogin = z.infer<typeof phoneLoginSchema>;
