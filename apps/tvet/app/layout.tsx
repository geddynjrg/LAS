import "@workspace/ui/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DM_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { SidebarInset } from "@workspace/ui/components/sidebar";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { SessionProvider } from "@/hooks/useSession";
import { type Locale } from "@/i18n/config";
import { getInstitutions } from "@/lib/api/institutions";
import { getSession } from "@/lib/session";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export interface RootLayoutProps {
  children?: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const institutions = await getInstitutions();
  const session = await getSession();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${dmSans.variable} font-sans`}
      title="TVET"
    >
      <body className="min-h-svh antialiased [--header-height:4.5rem]">
        <SessionProvider initialSession={session ? true : null}>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <AppHeader />
              <AppSidebar
                locale={locale}
                institutions={institutions.data?.institutions}
              />
              <SidebarInset className="min-h-svh">
                <Suspense fallback={<p>loading</p>}>{children}</Suspense>
                <AppFooter institutions={institutions.data?.institutions} />
              </SidebarInset>
            </Providers>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
