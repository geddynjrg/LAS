"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { IconCheck } from "@tabler/icons-react";
import type { FC } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const checkboxVariants = cva({
  base: "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible-ring shrink-0 rounded-sm border disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      sm: "peer h-4 w-4",
      default: "peer h-6 w-6",
      lg: "peer h-8 w-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface CheckboxProps extends VariantProps<typeof checkboxVariants> {
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: FC<CheckboxProps> = ({ size, className, ...props }) => (
  <CheckboxPrimitive.Root
    className={cn(checkboxVariants({ size }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <IconCheck className="size-full" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
