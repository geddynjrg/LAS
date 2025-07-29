import { Slot } from "@radix-ui/react-slot";
import type { FC, ReactNode } from "react";

import { cn, cva, type VariantProps } from "@workspace/ui/lib/utils";

export interface UnderlineProps extends VariantProps<typeof underlineVariants> {
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
  variant?: "primary" | "link" | "white";
}

export const underlineVariants = cva({
  base: "flex w-fit border-b",
  variants: {
    variant: {
      primary:
        "border-primary [&>svg]:text-primary text-foreground hover:text-primary",
      link: "border-link [&>svg]:text-link text-foreground hover:text-link",
      white:
        "border-neutral-100 text-neutral-100 hover:opacity-75 [&>svg]:text-neutral-100",
    },
  },
  defaultVariants: {
    variant: "link",
  },
});

export const Underline: FC<UnderlineProps> = ({
  variant,
  children,
  asChild,
  className,
  ...props
}) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp className={cn(underlineVariants({ variant, className }))} {...props}>
      {children}
    </Comp>
  );
};
