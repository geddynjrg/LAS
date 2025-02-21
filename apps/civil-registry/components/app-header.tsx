import { useTranslations } from "next-intl";
import type { FC, ReactNode } from "react";

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
      startDecorator={<Logo />}
      endDecorator={
        <>
          <FlagSelect
            className="max-md:hidden"
            defaultValue={locale}
            options={locales.map((locale) => ({
              value: locale.value,
              label: locale.labelShort,
            }))}
            onChange={setUserLocale}
          />
          <SidebarTrigger />
        </>
      }
    />
  );
};
