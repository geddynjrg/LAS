"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { FC, ReactNode } from "react";

import { SidebarProvider } from "@workspace/ui/components/sidebar";

import { PersonNationalIdStatusProvider } from "@/hooks/usePersonNationalIdStatus";

export interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="civil-registry"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <PersonNationalIdStatusProvider>
          {children}
        </PersonNationalIdStatusProvider>
      </SidebarProvider>
    </NextThemesProvider>
  );
};
