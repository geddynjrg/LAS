import "@workspace/ui/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Header } from "@workspace/ui/components/header";
import { LocaleSwitcher } from "@workspace/ui/components/locale-switcher";
import { SidebarInset, SidebarTrigger } from "@workspace/ui/components/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { Logo } from "@/components/logo";
import { Providers } from "@/components/providers";
import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/lib/locale";

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
            <Header
              isFloating
              startDecorator={<Logo />}
              endDecorator={
                <>
                  <LocaleSwitcher
                    defaultValue={locale}
                    items={locales}
                    onChange={setUserLocale}
                  />
                  <Button asChild>
                    <Link href="/apply">Apply</Link>
                  </Button>
                  <SidebarTrigger>Menu</SidebarTrigger>
                </>
              }
            >
              hello
            </Header>

            <AppSidebar />

            <SidebarInset>{children}</SidebarInset>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
