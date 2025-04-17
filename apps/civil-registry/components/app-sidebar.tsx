"use server";

import { IconPlus, IconUser } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { FC } from "react";

import { NavLink } from "@workspace/ui/components/nav-link";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSubmenu,
} from "@workspace/ui/components/sidebar";

import { findFemaleWithChildren } from "@/lib/services/person-service";
import { getFullName } from "@/lib/util/full-name";

export const AppSidebar: FC = async () => {
  const t = await getTranslations();
  const persons = await findFemaleWithChildren();

  return (
    <Sidebar title={t("Common.menu")}>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem asChild key="home">
            <NavLink href="/">{t("Navigation.home")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild key="national">
            <NavLink href="#">{t("Navigation.national")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild key="countries">
            <NavLink href="#">{t("Navigation.countries")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild key="help-and-support">
            <NavLink href="#">{t("Navigation.help-and-support")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild key="terms-and-conditions">
            <NavLink href="#">{t("Navigation.terms-and-conditions")}</NavLink>
          </SidebarMenuItem>
          <SidebarMenuItem asChild key="privacy-policy">
            <NavLink href="#">{t("Navigation.privacy-policy")}</NavLink>
          </SidebarMenuItem>
        </SidebarMenu>

        <h2 className="mt-6 border-b pb-2 text-center">Demo Flows</h2>

        <SidebarMenu>
          <SidebarMenuItem asChild key="add-child">
            <NavLink href="/add">
              <IconPlus /> Add child
            </NavLink>
          </SidebarMenuItem>
          <SidebarSubmenu
            title="Change user"
            icon={<IconUser />}
            key="change-user"
          >
            {persons.map((person) => (
              <SidebarMenuItem asChild key={`${person.id}-change-user`}>
                <Link href={`/${person.id}`}>{getFullName(person)}</Link>
              </SidebarMenuItem>
            ))}
          </SidebarSubmenu>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
