import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const dataNodeVariants = cva({
  variants: {
    variant: {
      default: "text-foreground",
      highlighted: "text-yellow-500",
      disabled: "text-neutral-600",
    },
    orientation: {
      vertical: "flex flex-col",
      horizontal: "flex flex-row justify-between",
    },
  },
  defaultVariants: {
    variant: "default",
    orientation: "vertical",
  },
});

export interface DataNodeProps extends VariantProps<typeof dataNodeVariants> {
  label: string;
  children?: ReactNode;
  orientation?: "vertical" | "horizontal";
  required?: boolean;
  className?: string;
}

export const DataNode: FC<DataNodeProps> = ({
  children,
  label,
  variant,
  orientation,
  required,
  className,
}) => (
  <div className={cn(dataNodeVariants({ variant, orientation }), className)}>
    <div className="font-bold">
      {label}
      {required && <span className="text-destructive">*</span>}
    </div>
    {children}
  </div>
);
