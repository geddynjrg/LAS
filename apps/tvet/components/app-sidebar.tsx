import {
  IconBooks,
  IconBuilding,
  IconChecklist,
  IconClipboardText,
  IconHome,
  IconPhone,
} from "@tabler/icons-react";
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
  SidebarSubmenu,
} from "@workspace/ui/components/sidebar";

import { locales, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/lib/locale";

export interface AppSidebarProps {
  locale: Locale;
  institutions?: { id: string | number; title: string; path_alias: string }[];
}

export const AppSidebar: FC<AppSidebarProps> = ({
  locale,
  institutions = [],
}) => {
  const t = useTranslations("Menu");

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
            <NavLink href="/">
              <IconHome />
              {t("home")}
            </NavLink>
          </SidebarMenuItem>

          {institutions.length > 0 && (
            <SidebarSubmenu title={t("institutions")} icon={<IconBuilding />}>
              {institutions.map((institution) => (
                <SidebarMenuItem key={institution.id} asChild>
                  <NavLink href={institution.path_alias}>
                    {institution.title}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarSubmenu>
          )}

          <SidebarMenuItem asChild>
            <NavLink href="/courses">
              <IconBooks />
              {t("courses")}
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/sponsorships">
              <IconClipboardText />
              {t("sponsorships")}
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/apply">
              <IconChecklist />
              {t("apply")}
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/contact">
              <IconPhone />
              {t("contact")}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
