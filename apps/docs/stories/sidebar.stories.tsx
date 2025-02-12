import type { Meta, StoryObj } from "@storybook/react";
import {
  IconCalendar,
  IconHome,
  IconInbox,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSubmenu,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

const meta = {
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Sidebar title for screen readers",
  },
  decorators: [
    (Story) => (
      <div className="min-h-80 [--sidebar-width:15.5rem]">
        <SidebarProvider>{Story()}</SidebarProvider>
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <>
      <Sidebar {...props}>
        <SidebarHeader>Sidebar header</SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <IconHome />
              Home
            </SidebarMenuItem>
            <SidebarMenuItem>
              <IconInbox />
              Inbox
            </SidebarMenuItem>

            <SidebarMenuItem>
              <IconCalendar />
              Calendar
            </SidebarMenuItem>
            <SidebarMenuItem>
              <IconSearch />
              Search
            </SidebarMenuItem>
            <SidebarSubmenu title="Settings" icon={<IconSettings />}>
              <SidebarMenuItem>Profile</SidebarMenuItem>
              <SidebarMenuItem>Account</SidebarMenuItem>
              <SidebarMenuItem>Notifications</SidebarMenuItem>
            </SidebarSubmenu>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>Sidebar footer</SidebarFooter>
      </Sidebar>
      <SidebarTrigger className="visible md:hidden" />
    </>
  ),
} satisfies Story;
