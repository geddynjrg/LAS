import "@workspace/ui/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { DM_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { SidebarInset } from "@workspace/ui/components/sidebar";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { type Locale } from "@/i18n/config";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${dmSans.variable} font-sans`}
    >
      <body className="min-h-svh antialiased [--header-height:4.5rem]">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppHeader />
            <AppSidebar locale={locale} />
            <SidebarInset>
              <Suspense fallback={<p>{t("Common.loading")}</p>}>
                {children}
              </Suspense>
            </SidebarInset>
            <AppFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
