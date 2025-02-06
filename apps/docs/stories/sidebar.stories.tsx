import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarTrigger,
} from "@workspace/ui/components/sidebar";

// Menu items.
const items = [
	{
		title: "Home",
		url: "#",
		icon: Home,
	},
	{
		title: "Inbox",
		url: "#",
		icon: Inbox,
	},
	{
		title: "Calendar",
		url: "#",
		icon: Calendar,
	},
	{
		title: "Search",
		url: "#",
		icon: Search,
	},
	{
		title: "Settings",
		url: "#",
		icon: Settings,
		children: [
			{
				title: "Profile",
				url: "#",
			},
			{
				title: "Account",
				url: "#",
			},
			{
				title: "Notifications",
				url: "#",
			},
		],
	},
];

const meta = {
	component: Sidebar,
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
				<SidebarHeader>Team switch</SidebarHeader>
				<SidebarContent>
					<SidebarMenu>
						{items.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild>
									<a href={item.url}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								</SidebarMenuButton>

								{item.children && (
									<SidebarMenuSub>
										{item.children.map((child) => (
											<SidebarMenuSubItem
												key={child.title}
											>
												<SidebarMenuSubButton asChild>
													<a href={child.url}>
														{child.title}
													</a>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								)}
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarContent>
				<SidebarFooter>nav user</SidebarFooter>
			</Sidebar>
			<SidebarTrigger className="visible md:hidden" />
		</>
	),
} satisfies Story;
