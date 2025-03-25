import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/app/(auth)/login/login-schema";

export const result = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: authorizeMockUser,
    }),
  ],
});

async function authorizeMockUser(credentials: unknown) {
  const data = loginSchema.parse(credentials);

  return data;
}

// re-type the exported values to fix the type errors
// https://github.com/nextauthjs/next-auth/discussions/9950#discussioncomment-9135791
export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
