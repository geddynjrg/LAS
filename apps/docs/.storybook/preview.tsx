import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import React from "react";

import enTranslations from "@workspace/ui/messages/en-gb";
import swTranslations from "@workspace/ui/messages/sw";

import "@workspace/ui/globals.css";

export default {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    locale: {
      description: "Internationalization locale",
      toolbar: {
        title: "Locale",
        dynamicTitle: true,
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "sw", title: "Swahili" },
        ],
      },
    },
  },
  initialGlobals: {
    locale: "en",
  },
} satisfies Preview;

export const decorators = [
  withThemeByClassName({
    themes: {
      default: "default",
      TVET: "tvet",
      Uwezo: "uwezo",
      "Civil registry": "civil-registry",
    },
    defaultTheme: "Civil registry",
  }),
  (Story, { globals }) => (
    <NextIntlClientProvider
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      locale={globals.locale ?? "en"}
      messages={globals.locale === "sw" ? swTranslations : enTranslations}
    >
      <Story />
    </NextIntlClientProvider>
  ),
] satisfies Decorator[];
