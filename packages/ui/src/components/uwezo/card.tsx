import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const cardVariants = cva({
  base: "rounded-2xl border p-5",
  variants: {
    radius: {
      sm: "rounded-sm",
      lg: "rounded-2xl",
    },
    variant: {
      primary: "border-primary",
      blue: "border-blue-500 bg-blue-100 text-blue-500",
      green: "border-green-500 bg-green-100 text-green-500",
    },
  },
  defaultVariants: {
    radius: "sm",
    variant: "primary",
  },
});

export interface CardProps extends VariantProps<typeof cardVariants> {
  className?: string;
  children?: ReactNode;
  variant?: "primary" | "blue" | "green";
  radius?: "sm" | "lg";
}

export const Card: FC<CardProps> = ({
  variant,
  radius,
  className,
  children,
}) => {
  return (
    <div className={cn(cardVariants({ variant, radius }), className)}>
      {children}
    </div>
  );
};
