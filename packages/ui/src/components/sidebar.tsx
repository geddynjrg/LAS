"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { Slot } from "@radix-ui/react-slot";
import { IconChevronDown, IconMenu2, IconX } from "@tabler/icons-react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
  type RefObject,
} from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@workspace/ui/components/sheet";
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

export const SidebarProvider: FC<SidebarProviderProps> = ({ children }) => {
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

export interface SidebarProps {
  title: string;
  closeTitle?: string;
  side?: "left" | "right";
  ref?: RefObject<HTMLDivElement>;
  className?: string;
  children?: ReactNode;
}

export const Sidebar: FC<SidebarProps> = ({
  title,
  closeTitle,
  side = "right",
  className,
  children,
  ...props
}) => {
  const { openMobile, setOpenMobile } = useSidebar();

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
      <SheetTitle className="sr-only">{title}</SheetTitle>
      <SheetContent
        aria-describedby={undefined}
        data-sidebar="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground w-(--sidebar-width,15.5rem) top-0 p-0 [&>button]:hidden",
          className,
        )}
        side={side}
      >
        <div className="flex h-full w-full flex-col">
          <div className="border-sidebar-foreground flex min-h-12 justify-end border-b px-1 py-2">
            <SheetClose asChild>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-none px-1 py-2 font-normal [&_svg]:size-6"
              >
                {closeTitle} <IconX />
              </Button>
            </SheetClose>
          </div>

          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const SidebarTrigger: FC<ButtonProps> = ({
  className,
  onClick,
  children,
  ...props
}) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      variant="neutral"
      className={cn(
        "size-13 hover:bg-header focus-visible:bg-header flex flex-col gap-0 rounded-none p-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <IconMenu2 />
      {children && <span className="text-xs font-normal">{children}</span>}
    </Button>
  );
};

export interface SidebarInsetProps {
  ref?: RefObject<HTMLElement>;
  className?: string;
  children?: ReactNode;
}

export const SidebarInset: FC<SidebarInsetProps> = ({
  className,
  ...props
}) => {
  return (
    <main
      className={cn(
        "bg-site-background max-w-(--sidebar-inset-max-width,2000px) mx-auto flex min-h-[calc(100svh-var(--header-height))] flex-1 flex-col",
        className,
      )}
      {...props}
    />
  );
};

export interface SidebarHeaderProps {
  ref?: RefObject<HTMLDivElement>;
  className?: string;
  children?: ReactNode;
}

export const SidebarHeader: FC<SidebarHeaderProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      data-sidebar="header"
      className={cn(
        "border-foreground flex flex-col gap-2 border-b p-4",
        className,
      )}
      {...props}
    />
  );
};

export interface SidebarFooterProps {
  ref?: RefObject<HTMLDivElement>;
  className?: string;
  children?: ReactNode;
}

export const SidebarFooter: FC<SidebarFooterProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
};

export interface SidebarContentProps {
  ref?: RefObject<HTMLDivElement>;
  className?: string;
  children?: ReactNode;
}

export const SidebarContent: FC<SidebarContentProps> = ({
  className,
  ...props
}) => {
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

export interface SidebarMenuProps {
  ref?: RefObject<HTMLUListElement>;
  className?: string;
  children?: ReactNode;
}

export const SidebarMenu: FC<SidebarMenuProps> = ({ className, ...props }) => (
  <ul
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col", className)}
    {...props}
  />
);

export const SidebarSubmenu: FC<{
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
}> = ({ title, icon, children }) => {
  const collapsableTriggerRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLUListElement>(null);

  function scrollSubmenuIntoView() {
    // scroll submenu into view on next frame
    window.setTimeout(() => {
      submenuRef.current?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }, 0);
  }

  // set submenu open if it has an active child
  useLayoutEffect(() => {
    const hasActiveChild = !!submenuRef.current?.querySelector(
      '[data-active="true"]',
    );

    if (hasActiveChild) {
      collapsableTriggerRef.current?.click();
    }
  }, []);

  return (
    <Collapsible asChild>
      <li data-sidebar="menu-item">
        <CollapsibleTrigger asChild ref={collapsableTriggerRef}>
          <SidebarMenuButton className="group" onClick={scrollSubmenuIntoView}>
            {icon}
            {title}
            <IconChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent asChild forceMount>
          <ul
            ref={submenuRef}
            data-sidebar="menu-sub"
            className="bg-sidebar-accent hidden min-w-0 flex-col data-[state=open]:flex"
          >
            {children}
          </ul>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
};

export const SidebarMenuItem: FC<{
  asChild?: boolean;
  children?: ReactNode;
}> = ({ asChild, children }) => {
  return (
    <li data-sidebar="menu-item">
      <SidebarMenuButton asChild={asChild}>{children}</SidebarMenuButton>
    </li>
  );
};

interface SidebarMenuButtonProps {
  asChild?: boolean;
  onClick?: () => unknown;
  className?: string;
  children?: ReactNode;
}

const SidebarMenuButton: FC<SidebarMenuButtonProps> = ({
  asChild = false,
  className,
  onClick,
  ...props
}) => {
  const { setOpenMobile } = useSidebar();

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-sidebar="menu-button"
      onClick={onClick ? onClick : () => setOpenMobile(false)}
      className={cn(
        "ring-ring text-foreground border-sidebar-foreground flex min-h-12 w-full cursor-pointer flex-row items-center gap-2 border-b px-4 py-2 text-sm [&>svg]:size-5 [&>svg]:shrink-0",
        "hover:bg-sidebar-active hover:text-sidebar-active-foreground",
        "data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-active-foreground",
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
