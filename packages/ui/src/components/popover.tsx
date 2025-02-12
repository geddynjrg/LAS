"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { IconX } from "@tabler/icons-react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverProps {
  title: string;
  className?: string;
  withArrow?: boolean;
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
}

export const PopoverContent: React.FC<PopoverProps> = ({
  title,
  className,
  withArrow = true,
  sideOffset = 4,
  side,
  children,
}) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      side={side} // default side is bottom
      sideOffset={sideOffset}
      className={cn(
        "bg-background text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md p-4 shadow-[0px_1px_5px_0px_rgba(0,0,0,0.2)] outline-none",
        className,
      )}
    >
      {/* Arrow component */}
      {withArrow && (
        <PopoverPrimitive.PopoverArrow
          className="fill-background drop-shadow-[0_0_3px_rgba(0,0,0,0.2)] [clip-path:inset(0_-10px_-10px_-10px)]"
          width={34}
          height={17}
        />
      )}

      {/* Close button to handle in popover closing */}
      <PopoverPrimitive.Close asChild className="absolute right-0 top-0">
        <Button variant="ghost">
          <IconX className="text-neutral-500" />
        </Button>
      </PopoverPrimitive.Close>

      <h1 className="mb-4 mr-5 text-lg font-bold">{title}</h1>

      {/* Content */}
      <div className="flex flex-col gap-4">{children}</div>
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
);

export const PopoverFooter: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <div className="flex flex-row justify-end gap-4">{children}</div>;
