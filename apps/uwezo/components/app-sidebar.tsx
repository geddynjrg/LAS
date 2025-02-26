import {
  IconBooks,
  IconBuilding,
  IconChecklist,
  IconClipboardText,
  IconHome,
  IconPhone,
} from "@tabler/icons-react";
//import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSubmenu,
} from "@workspace/ui/components/sidebar";

import { NavLink } from "@/components/nav-link";

export const AppSidebar: FC = () => {
  // const t = useTranslations("Common");

  return (
    <Sidebar
      title={/* t("menu") */ "menu"}
      closeTitle={/* t("closeMenu") */ "Close Menu"}
    >
      <SidebarHeader className="md:hidden">Language select</SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink href="/">
              <IconHome />
              Front page
            </NavLink>
          </SidebarMenuItem>

          <SidebarSubmenu title="Institutions" icon={<IconBuilding />}>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/1">institution 1</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/2">institution 2</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/3">institution 3</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/4">institution 4</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/5">institution 5</NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <NavLink href="/institution/6">institution 6</NavLink>
            </SidebarMenuItem>
          </SidebarSubmenu>

          <SidebarMenuItem asChild>
            <NavLink href="/courses">
              <IconBooks />
              Courses
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/sponsorships">
              <IconClipboardText />
              Sopnsorships
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/apply">
              <IconChecklist />
              Apply now
            </NavLink>
          </SidebarMenuItem>

          <SidebarMenuItem asChild>
            <NavLink href="/sponsorships">
              <IconPhone />
              Contact
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>nav user</SidebarFooter>
    </Sidebar>
  );
};
