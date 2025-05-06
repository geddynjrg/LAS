import type commonEn from "@workspace/ui/messages/en.json";

import type en from "@/messages/en.json";

export type Locale = (typeof locales)[number]["value"];
export type Messages = typeof en & typeof commonEn;

export const locales = [
  { label: "English", labelShort: "ENG", value: "en" },
  { label: "Swahili", labelShort: "SWH", value: "sw" },
] as const;

export const defaultLocale = "en" satisfies Locale;

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
