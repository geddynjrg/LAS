import "@workspace/ui/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { SidebarInset } from "@workspace/ui/components/sidebar";

import { AppFooter } from "@/components/app-footer";
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
      <body className="min-h-svh antialiased [--header-height:4.5rem]">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppHeader />
            <AppSidebar locale={locale} />
            <SidebarInset>
              <ErrorBoundary>
                <Suspense fallback={<p>loading</p>}>{children}</Suspense>
              </ErrorBoundary>
            </SidebarInset>
            <AppFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
