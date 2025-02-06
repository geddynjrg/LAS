"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { FC, ReactNode } from "react";

import { SidebarProvider } from "@workspace/ui/components/sidebar";

export interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="tvet"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>{children}</SidebarProvider>
    </NextThemesProvider>
  );
};
