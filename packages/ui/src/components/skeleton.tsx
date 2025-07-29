import type { FC, PropsWithChildren } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface SkeletonProps extends PropsWithChildren {
  className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
};
