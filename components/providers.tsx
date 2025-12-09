'use client';

import { SessionProvider } from '@/hooks/useSession';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

export function Providers({
  children,
  initialSession = false,
}: {
  children: React.ReactNode;
  initialSession?: boolean;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="uwezo"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider initialSession={initialSession}>
        <SidebarProvider>{children}</SidebarProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}
