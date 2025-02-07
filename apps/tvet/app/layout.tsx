import "@workspace/ui/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { SidebarInset } from "@workspace/ui/components/sidebar";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "@/components/providers";
import { type Locale } from "@/i18n/config";

export interface RootLayoutProps {
  children?: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-svh antialiased [--header-height:4.5rem] [--sidebar-width:15.5rem] md:[--header-height:5.5rem]">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppHeader locale={locale} />

            <AppSidebar />

            <SidebarInset>{children}</SidebarInset>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
