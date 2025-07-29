import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface DividerProps {
  children?: ReactNode;
  className?: string;
}

export const Divider: FC<DividerProps> = ({ children, className }) => {
  return children ? (
    <div
      className={cn(
        "typo-body-medium flex items-center before:me-4 before:flex-1 before:border-t before:border-inherit after:ms-4 after:flex-1 after:border-t after:border-inherit",
        className,
      )}
    >
      {children}
    </div>
  ) : (
    <div className={cn("w-full border-t", className)} />
  );
};
