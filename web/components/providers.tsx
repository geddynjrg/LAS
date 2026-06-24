'use client';

import { LastVisitedPathTracker } from '@/components/last-visited-path-tracker';
import { SessionProvider } from '@/hooks/useSession';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';
import { Suspense } from 'react';

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
        <Suspense fallback={null}>
          <LastVisitedPathTracker />
        </Suspense>
        <SidebarProvider>{children}</SidebarProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}
