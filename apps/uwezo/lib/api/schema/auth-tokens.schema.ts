import { z } from "zod";

export const AuthTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

export type AuthTokensType = z.infer<typeof AuthTokensSchema>;
