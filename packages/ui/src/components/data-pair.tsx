import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface DataPairProps {
  children?: ReactNode;
  className?: string;
}

export const DataPair: FC<DataPairProps> = ({ children, className }) => (
  <div className={cn("flex items-center justify-between gap-3", className)}>
    {children}
  </div>
);
