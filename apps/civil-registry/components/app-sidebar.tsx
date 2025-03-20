import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

import { NavLink } from "./nav-link";

export const AppSidebar: FC = () => {
  const t = useTranslations();

  return (
    <Sidebar title={t("Common.menu")}>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink href="/">{t("Navigation.home")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="#">{t("Navigation.national")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="#">{t("Navigation.countries")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="#">{t("Navigation.help-and-support")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="#">{t("Navigation.terms-and-conditions")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild>
            <NavLink href="#">{t("Navigation.privacy-policy")}</NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
