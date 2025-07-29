"use client";

import {
  IconDashboard,
  IconDatabase,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { NavLink } from "@workspace/ui/components/nav-link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

export const AdminSidebar: FC = () => {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: IconDashboard,
      isActive: pathname.startsWith("/admin/dashboard"),
    },
    {
      href: "/admin/sync-queue",
      label: "Sync Queue",
      icon: IconDatabase,
      isActive: pathname.startsWith("/admin/sync-queue"),
    },
  ];

  return (
    <Sidebar title="Admin Panel" closeTitle="Close Menu" side="left">
      <SidebarHeader className="border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <IconSettings className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sidebar-foreground text-sm font-semibold">
              Admin Panel
            </h2>
            <p className="text-sidebar-foreground/70 text-xs">
              System Management
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href} asChild>
                <NavLink
                  href={item.href}
                  data-active={item.isActive}
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-active-foreground group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border mt-auto border-t">
        <SidebarMenu>
          <SidebarMenuItem asChild>
            <NavLink
              href="/logout"
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
            >
              <IconLogout className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
