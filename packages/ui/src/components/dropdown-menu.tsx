"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { IconCheck, IconChevronRight, IconCircle } from "@tabler/icons-react";
import type { ComponentProps, FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export interface DropdownMenuSubTriggerProps
  extends ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
  inset?: boolean;
}

export const DropdownMenuSubTrigger: FC<DropdownMenuSubTriggerProps> = ({
  className,
  inset,
  children,
  ...props
}) => (
  <DropdownMenuPrimitive.SubTrigger
    className={cn(
      "focus:bg-accent data-[state=open]:bg-accent flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <IconChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
);

export type DropdownMenuSubContentProps = ComponentProps<
  typeof DropdownMenuPrimitive.SubContent
>;

export const DropdownMenuSubContent: FC<DropdownMenuSubContentProps> = ({
  className,
  ...props
}) => (
  <DropdownMenuPrimitive.SubContent
    className={cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-[--radix-dropdown-menu-content-transform-origin] overflow-hidden rounded-md border p-1 shadow-lg",
      className,
    )}
    {...props}
  />
);

export type DropdownMenuContentProps = ComponentProps<
  typeof DropdownMenuPrimitive.Content
>;

export const DropdownMenuContent: FC<DropdownMenuContentProps> = ({
  className,
  sideOffset = 4,
  ...props
}) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border p-1 shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
);

export interface DropdownMenuItemProps
  extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
}

export const DropdownMenuItem: FC<DropdownMenuItemProps> = ({
  className,
  inset,
  ...props
}) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
);

export type DropdownMenuCheckboxItemProps = ComponentProps<
  typeof DropdownMenuPrimitive.CheckboxItem
>;

export const DropdownMenuCheckboxItem: FC<DropdownMenuCheckboxItemProps> = ({
  className,
  children,
  checked,
  ...props
}) => (
  <DropdownMenuPrimitive.CheckboxItem
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <IconCheck className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
);

export type DropdownMenuRadioItemProps = ComponentProps<
  typeof DropdownMenuPrimitive.RadioItem
>;

export const DropdownMenuRadioItem: FC<DropdownMenuRadioItemProps> = ({
  className,
  children,
  ...props
}) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <IconCircle className="size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
);

export interface DropdownMenuLabelProps
  extends ComponentProps<typeof DropdownMenuPrimitive.Label> {
  inset?: boolean;
}

export const DropdownMenuLabel: FC<DropdownMenuLabelProps> = ({
  className,
  inset,
  ...props
}) => (
  <DropdownMenuPrimitive.Label
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
);

export type DropdownMenuSeparatorProps = ComponentProps<
  typeof DropdownMenuPrimitive.Separator
>;

export const DropdownMenuSeparator: FC<DropdownMenuSeparatorProps> = ({
  className,
  ...props
}) => (
  <DropdownMenuPrimitive.Separator
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
);

export interface DropdownMenuShortcutProps {
  className?: string;
  children?: ReactNode;
}

export const DropdownMenuShortcut: FC<DropdownMenuShortcutProps> = ({
  className,
  ...props
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
