"use server";

import { IconPlus, IconUser } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSubmenu,
} from "@workspace/ui/components/sidebar";

import { findFemaleWithChildren } from "@/lib/services/person-service";
import { getFullName } from "@/lib/util/full-name";
import { NavLink } from "./nav-link";

export const AppSidebar: FC = async () => {
  const t = await getTranslations();
  const persons = await findFemaleWithChildren();

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
            {persons.map((person) => (
              <SidebarMenuItem asChild>
                <Link href={`/${person.id}`}>{getFullName(person)}</Link>
              </SidebarMenuItem>
            ))}
          </SidebarSubmenu>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
