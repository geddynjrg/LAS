import { Slot } from "@radix-ui/react-slot";
import type { FC, PropsWithChildren } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface RoundedCornerCardProps extends PropsWithChildren {
  asChild?: boolean;
  className?: string;
}

export const RoundedCornerCard: FC<RoundedCornerCardProps> = ({
  asChild,
  children,
  className,
}) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp className={cn("bg-theme-100 rounded-tr-2xl px-6 py-7", className)}>
      {children}
    </Comp>
  );
};
