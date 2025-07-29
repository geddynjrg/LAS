import type { FC, ReactNode } from "react";

import { SectionWrap } from "@workspace/ui/components/section-wrap";
import { cn } from "@workspace/ui/lib/utils";

export interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

export const ActionBar: FC<ActionBarProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 z-10 w-full",
        "-mx-(--app-container-side-padding) py-5",
        "bg-background shadow-[var(--box-shadow-elevation-03)]",
        className,
      )}
    >
      <SectionWrap
        className={cn("flex items-center justify-between gap-3 py-0")}
      >
        {children}
      </SectionWrap>
    </div>
  );
};
