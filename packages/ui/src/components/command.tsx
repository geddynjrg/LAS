"use client";

import {
  Dialog,
  DialogContent,
  type DialogProps,
} from "@radix-ui/react-dialog";
import { IconSearch } from "@tabler/icons-react";
import { Command as CommandPrimitive } from "cmdk";
import type { ComponentProps, FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const Command: FC<ComponentProps<typeof CommandPrimitive>> = ({
  className,
  ...props
}) => (
  <CommandPrimitive
    className={cn(
      "bg-background text-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
      className,
    )}
    {...props}
  />
);

export const CommandDialog: FC<DialogProps> = ({ children, ...props }) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden p-0 shadow-lg">
      <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </DialogContent>
  </Dialog>
);

export const CommandInput: FC<
  ComponentProps<typeof CommandPrimitive.Input>
> = ({ className, ...props }) => (
  // eslint-disable-next-line react/no-unknown-property
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <IconSearch className="mr-2 size-5 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      className={cn(
        "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
);

export const CommandList: FC<ComponentProps<typeof CommandPrimitive.List>> = ({
  className,
  ...props
}) => (
  <CommandPrimitive.List
    className={cn(
      "bg-background max-h-[300px] overflow-y-auto overflow-x-hidden",
      className,
    )}
    {...props}
  />
);

export const CommandEmpty: FC<ComponentProps<typeof CommandPrimitive.Empty>> = (
  props,
) => <CommandPrimitive.Empty className="py-6 text-center text-sm" {...props} />;

export const CommandGroup: FC<
  ComponentProps<typeof CommandPrimitive.Group>
> = ({ className, ...props }) => (
  <CommandPrimitive.Group
    className={cn(
      "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
      className,
    )}
    {...props}
  />
);

export const CommandSeparator: FC<
  ComponentProps<typeof CommandPrimitive.Separator>
> = ({ className, ...props }) => (
  <CommandPrimitive.Separator
    className={cn("bg-border -mx-1 h-px", className)}
    {...props}
  />
);

export const CommandItem: FC<ComponentProps<typeof CommandPrimitive.Item>> = ({
  className,
  ...props
}) => (
  <CommandPrimitive.Item
    className={cn(
      "data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
);
