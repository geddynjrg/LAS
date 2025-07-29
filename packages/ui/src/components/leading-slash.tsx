import { Slot } from "@radix-ui/react-slot";
import type { FC, PropsWithChildren } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface LeadingSlashProps extends PropsWithChildren {
  asChild?: boolean;
  className?: string;
}

export const LeadingSlash: FC<LeadingSlashProps> = ({
  asChild,
  className,
  ...props
}) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(
        "after:bg-primary relative pl-9 after:absolute after:left-0 after:top-[calc(50%-1px)] after:z-[1] after:h-[2px] after:w-5 after:content-['']",
        className,
      )}
      {...props}
    />
  );
};
