"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { cva, type VariantProps } from "cva-extended";
import type { ComponentProps, FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const selectVariants = cva({
  base: "border-input bg-background placeholder:text-muted-foreground focus:ring-ring ring-offset-background flex w-full max-w-[260px] items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  variants: {
    size: {
      sm: "h-7 text-sm",
      default: "h-10",
      lg: "h-12 text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SelectOption<T extends string> {
  label: ReactNode;
  value: T;
}

export interface SelectProps<T extends string>
  extends VariantProps<typeof selectVariants> {
  placeholder?: ReactNode;
  className?: string;
  options?: SelectOption<T>[] | readonly SelectOption<T>[];
  defaultValue?: T;
  disabled?: boolean;
  onValueChange?: (value: T) => void;
}

export const Select = <T extends string>({
  options,
  placeholder,
  className,
  size,
  ...props
}: SelectProps<T>) => {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectTrigger size={size} className={className}>
        <SelectPrimitive.Value placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
};

const SelectTrigger: FC<
  { className?: string; children: ReactNode } & VariantProps<
    typeof selectVariants
  >
> = ({ size, className, children }) => (
  <SelectPrimitive.Trigger className={cn(selectVariants({ size }), className)}>
    {children}
    <SelectPrimitive.Icon asChild>
      <IconChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const SelectScrollUpButton: FC = () => (
  <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
    <IconChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
);

const SelectScrollDownButton: FC = () => (
  <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
    <IconChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
);

const SelectContent: FC<ComponentProps<typeof SelectPrimitive.Content>> = ({
  className,
  children,
  position = "popper",
  ...props
}) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />

      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-(--radix-select-trigger-height) min-w-(--radix-select-trigger-width) w-full",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

const SelectItem: FC<ComponentProps<typeof SelectPrimitive.Item>> = ({
  className,
  children,
  ...props
}) => (
  <SelectPrimitive.Item
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>

    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <IconCheck className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
);
