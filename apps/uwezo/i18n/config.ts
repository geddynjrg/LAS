export type Locale = (typeof locales)[number]["value"];

export const locales = [
  { label: "English", labelShort: "ENG", value: "en" },
] as const;

export const defaultLocale = "en" satisfies Locale;
