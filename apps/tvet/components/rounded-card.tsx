import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const roundedCardVariants = cva({
  base: "rounded-tr-2xl px-6 py-7",
  variants: {
    variant: {
      default: "bg-theme-100",
      primary: "bg-primary text-primary-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface RoundedCardProps
  extends VariantProps<typeof roundedCardVariants> {
  className?: string;
  children?: ReactNode;
}

export const RoundedCard: FC<RoundedCardProps> = ({
  variant,
  className,
  children,
}) => {
  return (
    <div className={cn(roundedCardVariants({ variant }), className)}>
      {children}
    </div>
  );
};
