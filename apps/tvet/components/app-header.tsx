import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { FlagSelect } from "@workspace/ui/components/flag-select";
import { Header } from "@workspace/ui/components/header";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

import { Logo } from "@/components/logo";
import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/lib/locale";

export interface AppHeaderProps {
  locale: Locale;
}

export const AppHeader: FC<AppHeaderProps> = ({ locale }) => {
  return (
    <Header
      isFloating
      startDecorator={<Logo />}
      endDecorator={
        <>
          <FlagSelect
            className="invisible md:visible"
            defaultValue={locale}
            options={locales.map((locale) => ({
              value: locale.value,
              label: locale.labelShort,
            }))}
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
  );
};
