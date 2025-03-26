export type Locale = (typeof locales)[number]["value"];

export const locales = [
  { label: "English", labelShort: "ENG", value: "en-gb" },
  { label: "Swahili", labelShort: "SWH", value: "sw" },
] as const;

export const defaultLocale = "en-gb" satisfies Locale;
