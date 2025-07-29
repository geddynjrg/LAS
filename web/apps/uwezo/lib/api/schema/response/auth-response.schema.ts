import { z } from "zod";

import { AuthTokensSchema } from "@/lib/api/schema/auth-tokens.schema";

// Login response schema
export const LoginResponseSchema = z.object({
  data: AuthTokensSchema,
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;

// Register response schema
export const RegisterResponseSchema = z.object({
  data: z.object({
    mail: z.string(),
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
    status: z.string(),
  }),
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type RegisterResponseType = z.infer<typeof RegisterResponseSchema>;

// Password reset request response schema
export const PasswordResetRequestResponseSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type PasswordResetRequestResponseType = z.infer<
  typeof PasswordResetRequestResponseSchema
>;

// Password reset response schema
export const PasswordResetResponseSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type PasswordResetResponseType = z.infer<
  typeof PasswordResetResponseSchema
>;

// User profile response schema
export const UserProfileResponseSchema = z.object({
  data: z
    .object({
      email: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
      phoneNumber: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
      name: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
      roles: z.array(z.string()).optional(),
      created: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
      last_access: z
        .string()
        .nullable()
        .optional()
        .transform((val) => val ?? undefined),
    })
    .optional(),
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type UserProfileResponseType = z.infer<typeof UserProfileResponseSchema>;

// Logout response schema
export const LogoutResponseSchema = z.object({
  data: z
    .object({
      message: z.string(),
      removed_tokens: z.number().optional(),
    })
    .optional(),
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type LogoutResponseType = z.infer<typeof LogoutResponseSchema>;

// Token refresh response schema
export const TokenRefreshResponseSchema = z.object({
  data: AuthTokensSchema,
  meta: z
    .object({
      timestamp: z.number().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type TokenRefreshResponseType = z.infer<
  typeof TokenRefreshResponseSchema
>;
