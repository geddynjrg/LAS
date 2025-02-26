"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { SidebarProvider } from "@workspace/ui/components/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="uwezo"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>{children}</SidebarProvider>
    </NextThemesProvider>
  );
}
