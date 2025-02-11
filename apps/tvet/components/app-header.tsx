import { useTranslations } from "next-intl";
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
  const t = useTranslations("Common");

  return (
    <Header
      isFloating="mobile-only"
      startDecorator={<Logo />}
      className="md:bg-radial-[at_25%_25%] from-[#4f734e] to-[#365036] to-75%"
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
          <Button asChild>
            <Link href="/apply">{t("apply")}</Link>
          </Button>
          <SidebarTrigger className="md:hidden">{t("menu")}</SidebarTrigger>
        </>
      }
    />
  );
};
