import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface ApplyFormSubtitleProps {
  className?: string;
  children?: ReactNode;
}

export const ApplyFormSubtitle: FC<ApplyFormSubtitleProps> = ({
  children,
  className,
}) => {
  return (
    <h3
      className={cn("typo-h3 mb-4 border-b border-neutral-400 pb-2", className)}
    >
      {children}
    </h3>
  );
};
