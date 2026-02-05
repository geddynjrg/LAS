import { z } from 'zod';

export const StorePkceRequestSchema = z.object({
  state: z.string().min(1, 'State is required'),
  code_verifier: z.string().min(1, 'Code verifier is required'),
});

export type StorePkceRequest = z.infer<typeof StorePkceRequestSchema>;

export const ECitizenCallbackParamsSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export type ECitizenCallbackParams = z.infer<
  typeof ECitizenCallbackParamsSchema
>;

export const StorePkceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  state: z.string(),
  origin_captured: z.string().optional(),
  expires_at: z.number().optional(),
});

export type StorePkceResponse = z.infer<typeof StorePkceResponseSchema>;

export const ECitizenTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.literal('Bearer'),
  user: z.object({
    email: z.string().email(),
    name: z.string(),
    uid: z.number(),
    username: z.string(),
    is_new: z.boolean(),
  }),
});

export type ECitizenTokenResponse = z.infer<typeof ECitizenTokenResponseSchema>;
