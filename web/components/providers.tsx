"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { SidebarProvider } from "@workspace/ui/components/sidebar";

import { SessionProvider } from "@/hooks/useSession";

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
