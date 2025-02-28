import type { FC, PropsWithChildren } from "react";

import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export const gradientCornerCardVariants = cva({
  base: "text-primary-foreground bg-theme-100 py-8",
  variants: {
    color: {
      green: "bg-[var(--color-primary)]",
      red: "bg-[#AD6A6C]",
      blue: "bg-[#283044]",
    },
    gradient: {
      blend1:
        "bg-[url(/gradients/blend1.jpg)] bg-cover bg-bottom bg-blend-multiply",
      blend2: "bg-[url(/gradients/blend1.jpg)] bg-cover bg-blend-multiply",
      blend3: "bg-[url(/gradients/blend1.jpg)] bg-cover bg-blend-multiply",
    },
  },
  defaultVariants: {
    variant: undefined,
    gradient: undefined,
  },
});

export interface GradientCornerCardProps
  extends VariantProps<typeof gradientCornerCardVariants>,
    PropsWithChildren {
  className?: string;
}

export const GradientCornerCard: FC<GradientCornerCardProps> = ({
  children,
  className,
  color,
  gradient,
}) => {
  return (
    <RoundedCornerCard
      className={cn(gradientCornerCardVariants({ color, gradient }), className)}
    >
      {children}
    </RoundedCornerCard>
  );
};
