import { useTranslations } from "next-intl";
import type { FC } from "react";

import { FlagSelect } from "@workspace/ui/components/flag-select";
import { NavLink } from "@workspace/ui/components/nav-link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/lib/locale";

export interface AppSidebarProps {
  locale: Locale;
}

export const AppSidebar: FC<AppSidebarProps> = ({ locale }) => {
  const t = useTranslations("Common");

  return (
    <Sidebar title={t("menu")} closeTitle={t("closeMenu")}>
      <SidebarHeader>
        <FlagSelect
          defaultValue={locale}
          onChange={setUserLocale}
          options={locales}
          variant="list"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink href="/">{t("home")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="/dashboard">{t("myApplications")}</NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
