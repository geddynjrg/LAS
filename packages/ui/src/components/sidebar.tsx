"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "cva-extended";
import { Menu, PanelLeft } from "lucide-react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type FC,
	type ReactNode,
	type RefObject,
} from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { Sheet, SheetContent } from "@workspace/ui/components/sheet";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";

type SidebarContext = {
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContext | null>(null);

interface SidebarProviderProps {
	children: ReactNode;
}

const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = useState(false);

	// Helper to toggle the sidebar.
	const toggleSidebar = useCallback(() => {
		return setOpenMobile((open) => !open);
	}, [setOpenMobile]);

	const contextValue = useMemo<SidebarContext>(
		() => ({
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[isMobile, openMobile, setOpenMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			{children}
		</SidebarContext.Provider>
	);
};

interface SidebarProps {
	ref?: RefObject<HTMLDivElement>;
	className?: string;
	children?: ReactNode;
}

const Sidebar: FC<SidebarProps> = ({ ref, className, children, ...props }) => {
	const { isMobile, openMobile, setOpenMobile } = useSidebar();

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
				<SheetContent
					data-sidebar="sidebar"
					data-mobile="true"
					className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) top-0 p-0 [&>button]:hidden"
					side="right"
				>
					<div className="flex h-full w-full flex-col">
						{children}
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			ref={ref}
			data-sidebar="sidebar"
			className={cn(
				"top-(--header-height) w-(--sidebar-width) text-sidebar-foreground bg-sidebar group peer fixed bottom-0 left-0 z-10 flex h-full flex-col",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};

interface SidebarTriggerProps extends ButtonProps {
	className?: string;
}

const SidebarTrigger: FC<SidebarTriggerProps> = ({
	className,
	onClick,
	...props
}) => {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			variant="ghost"
			className={cn("h-7 w-7 p-0", className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<Menu />
			<span className="sr-only">Toggle Menu</span>
		</Button>
	);
};

interface SidebarInsetProps {
	ref?: RefObject<HTMLElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarInset: FC<SidebarInsetProps> = ({ className, ...props }) => {
	return (
		<main
			className={cn(
				"md:ml-(--sidebar-width) flex min-h-[calc(100svh-var(--header-height))] flex-1 flex-col",
				className,
			)}
			{...props}
		/>
	);
};

interface SidebarHeaderProps {
	ref?: RefObject<HTMLDivElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarHeader: FC<SidebarHeaderProps> = ({ className, ...props }) => {
	return (
		<div
			data-sidebar="header"
			className={cn("flex flex-col gap-2 p-2", className)}
			{...props}
		/>
	);
};

interface SidebarFooterProps {
	ref?: RefObject<HTMLDivElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarFooter: FC<SidebarFooterProps> = ({ className, ...props }) => {
	return (
		<div
			data-sidebar="footer"
			className={cn("flex flex-col gap-2 p-2", className)}
			{...props}
		/>
	);
};

interface SidebarContentProps {
	ref?: RefObject<HTMLDivElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarContent: FC<SidebarContentProps> = ({ className, ...props }) => {
	return (
		<div
			data-sidebar="content"
			className={cn(
				"flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
				className,
			)}
			{...props}
		/>
	);
};

interface SidebarMenuProps {
	ref?: RefObject<HTMLUListElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarMenu: FC<SidebarMenuProps> = ({ className, ...props }) => (
	<ul
		data-sidebar="menu"
		className={cn("flex w-full min-w-0 flex-col gap-1", className)}
		{...props}
	/>
);

interface SidebarMenuItemProps {
	ref?: RefObject<HTMLLIElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarMenuItem: FC<SidebarMenuItemProps> = ({ className, ...props }) => (
	<li
		data-sidebar="menu-item"
		className={cn("group/menu-item relative", className)}
		{...props}
	/>
);

const sidebarMenuButtonVariants = cva({
	base: "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
	variants: {
		variant: {
			default:
				"hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
			outline:
				"bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
		},
		size: {
			default: "h-8 text-sm",
			sm: "h-7 text-xs",
			lg: "h-12 text-sm",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

interface SidebarMenuButtonProps
	extends VariantProps<typeof sidebarMenuButtonVariants> {
	asChild?: boolean;
	isActive?: boolean;
	className?: string;
	children?: ReactNode;
}

const SidebarMenuButton: FC<SidebarMenuButtonProps> = ({
	asChild = false,
	isActive = false,
	variant = "default",
	size = "default",
	className,
	...props
}) => {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-sidebar="menu-button"
			data-size={size}
			data-active={isActive}
			className={cn(
				sidebarMenuButtonVariants({ variant, size }),
				className,
			)}
			{...props}
		/>
	);
};

interface SidebarMenuActionProps {
	ref?: RefObject<HTMLUListElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarMenuSub: FC<SidebarMenuActionProps> = ({
	className,
	...props
}) => (
	<ul
		data-sidebar="menu-sub"
		className={cn(
			"border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
			className,
		)}
		{...props}
	/>
);

interface SidebarMenuSubItemProps {
	ref?: RefObject<HTMLLIElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarMenuSubItem: FC<SidebarMenuSubItemProps> = (props) => (
	<li {...props} />
);

interface SidebarMenuSubButtonProps {
	asChild?: boolean;
	size?: "sm" | "md";
	isActive?: boolean;
	ref?: RefObject<HTMLAnchorElement>;
	className?: string;
	children?: ReactNode;
}

const SidebarMenuSubButton: FC<SidebarMenuSubButtonProps> = ({
	asChild = false,
	size = "md",
	isActive,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : "a";

	return (
		<Comp
			data-sidebar="menu-sub-button"
			data-size={size}
			data-active={isActive}
			className={cn(
				"text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
				"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
				size === "sm" && "text-xs",
				size === "md" && "text-sm",
				className,
			)}
			{...props}
		/>
	);
};

function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.");
	}

	return context;
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
};
