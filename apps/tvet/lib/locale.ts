"use server";

import { cookies } from "next/headers";

import { defaultLocale, type Locale } from "@/i18n/config";

const COOKIE_NAME = "i18n_locale";

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}

export async function getMessages(locale: string) {
  const [messages, commonMessages] = await Promise.all([
    import(`@/messages/${locale}`),
    // `@workspace/ui/messages/${locale}` seems not to work
    // https://github.com/vercel/next.js/issues/63372
    import(`../../../packages/ui/src/messages/${locale}`),
  ]).catch((err) => {
    console.error("Failed to load messages", err);

    return [{}, {}];
  });

  return Object.assign({}, commonMessages.default, messages.default);
}
