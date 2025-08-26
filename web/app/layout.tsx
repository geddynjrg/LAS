import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { Providers } from '@/components/providers';
import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/session';
import { Loader } from '@workspace/ui/components/loader';
import { SidebarInset } from '@workspace/ui/components/sidebar';
import '@workspace/ui/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { DM_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { userAgent } from 'next/server';
import { type ReactNode, Suspense } from 'react';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const headersList = await headers();
  const session = await getSession();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${dmSans.variable} font-sans device-type-${getDeviceType(headersList)}`}
    >
      <body className="min-h-svh antialiased [--header-height:4.5rem]">
        <NextIntlClientProvider messages={messages}>
          <Providers initialSession={!!session}>
            <AppHeader />
            <AppSidebar locale={locale} />
            <SidebarInset className="bg-gradient-to-b from-[hsl(0,0%,97%)] to-[hsl(310,50%,97%)]">
              <Suspense
                fallback={
                  <div className="flex flex-1 items-center justify-center">
                    <Loader size={40} />
                  </div>
                }
              >
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

function getDeviceType(headers: Headers) {
  const { device } = userAgent({ headers });

  return device.type === 'mobile' ? 'mobile' : 'desktop';
}
