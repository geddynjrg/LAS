import Link from "next/link";
import type { FC } from "react";

import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { LocaleSelect } from "@/components/locale-select";
import { Logo } from "@/components/logo";
import { type Locale } from "@/i18n/config";

export interface AppHeaderProps {
  locale: Locale;
}

export const AppHeader: FC<AppHeaderProps> = ({ locale }) => {
  return (
    <Header
      startDecorator={
        <Link href="/" className="mt-2 block">
          <Logo className="size-11" />
        </Link>
      }
      endDecorator={
        <>
          <LocaleSelect defaultValue={locale} />
          <SidebarTrigger className="mr-4 w-4" />
        </>
      }
    />
  );
};
