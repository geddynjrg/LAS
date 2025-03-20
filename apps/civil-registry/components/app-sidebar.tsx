"use client";

import { IconPlus, IconUser } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSubmenu,
} from "@workspace/ui/components/sidebar";

import { NavLink } from "./nav-link";

export const AppSidebar: FC = () => {
  const t = useTranslations();

  function handleChangeUser(id: string) {
    alert("not implemented yet");
  }

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

        <h2 className="mt-6 border-b pb-2 text-center">Demo Flows</h2>

        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink href="/add">
              <IconPlus /> Add child
            </NavLink>
          </SidebarMenuItem>
          <SidebarSubmenu title="Change user" icon={<IconUser />}>
            <SidebarMenuItem asChild>
              <a href="#" onClick={() => handleChangeUser("1")}>
                User 1
              </a>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <a href="#" onClick={() => handleChangeUser("2")}>
                User 2
              </a>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <a href="#" onClick={() => handleChangeUser("3")}>
                User 3
              </a>
            </SidebarMenuItem>
          </SidebarSubmenu>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
