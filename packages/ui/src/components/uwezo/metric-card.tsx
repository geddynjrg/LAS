import type { FC, ReactNode } from "react";

import { Countup } from "@workspace/ui/components/countup";
import { cn } from "@workspace/ui/lib/utils";

export interface MetricCardProps {
  icon: ReactNode;
  title: string;
  count: number;
  className?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
  icon,
  title,
  count,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-background flex items-center gap-4 p-1 lg:gap-2",
        className,
      )}
    >
      <div className="border-theme-100 w-17.5 h-17.5 rounded-full border p-2.5">
        <div className="bg-primary text-background flex h-full w-full items-center justify-center rounded-full">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <p className="text-3xl">
          {
            <Countup
              end={count}
              decimal=","
              scrollSpyDelay={4}
              enableScrollSpy
              scrollSpyOnce
            />
          }
        </p>
        <p className="typo-h6-sm uppercase">{title}</p>
      </div>
    </div>
  );
};
