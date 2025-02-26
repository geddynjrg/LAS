import { IconArrowRight } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface TrainingAreaCardProps {
  title: string;
  children?: ReactNode;
  asChild?: boolean;
  className?: string;
}

export const TrainingAreaCard: FC<TrainingAreaCardProps> = ({
  children,
  className,
  title,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-theme-200 shadow-var(--box-shadow-elevation-02) text-background group flex items-center justify-between gap-4 rounded-md px-4 py-5",
        className,
      )}
      {...props}
    >
      <div>
        <div className="typo-h5">{title}</div>
        <div className="typo-body-small">{children}</div>
      </div>

      <div className="text-primary group-hover:bg-primary group-hover:text-background flex size-12 items-center justify-center rounded-full bg-white shadow-[var(--box-shadow-elevation-02)]">
        <IconArrowRight />
      </div>
    </div>
  );
};
