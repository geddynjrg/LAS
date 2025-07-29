import { cva, type VariantProps } from "cva-extended";
import { type FC, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const bulletBoxVariants = cva({
  base: "bg-primary text-primary-foreground flex aspect-square items-center justify-center whitespace-nowrap rounded-xl font-bold [&_svg]:pointer-events-none [&_svg]:size-full",
  variants: {
    size: {
      sm: "size-10 p-2 text-sm",
      md: "size-13 p-3",
      lg: "size-20 p-3.5 text-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface ButtonProps extends VariantProps<typeof bulletBoxVariants> {
  className?: string;
  children?: ReactNode;
}

export const BulletBox: FC<ButtonProps> = ({
  size,
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn(bulletBoxVariants({ size, className }))} {...props}>
      {children}
    </div>
  );
};
