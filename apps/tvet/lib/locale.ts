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
