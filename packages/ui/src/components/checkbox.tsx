"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { IconCheck } from "@tabler/icons-react";
import { useId, type FC, type ReactNode } from "react";

import { Label } from "@workspace/ui/components/label";
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
  children?: ReactNode;
  className?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  id,
  size,
  children,
  className,
  ...props
}) => {
  const componentId = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <CheckboxPrimitive.Root
        className={checkboxVariants({ size })}
        id={id || componentId}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <IconCheck className="size-full" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {children && <Label htmlFor={id || componentId}>{children}</Label>}
    </div>
  );
};
