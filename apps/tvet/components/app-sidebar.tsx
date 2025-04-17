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
            <NavLink href="/">
              <IconHome />
              Front page
            </NavLink>
          </SidebarMenuItem>

          {institutions.length > 0 && (
            <SidebarSubmenu title="Institutions" icon={<IconBuilding />}>
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
              Courses
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/sponsorships">
              <IconClipboardText />
              Sponsorships
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/apply">
              <IconChecklist />
              Apply now
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/contact">
              <IconPhone />
              Contact
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
