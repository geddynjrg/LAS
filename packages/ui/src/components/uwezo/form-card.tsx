import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface FormCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}

export const FormCard: FC<FormCardProps> = ({
  title,
  subtitle,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "px-4 py-8",
        "rounded-2xl shadow-[var(--box-shadow-elevation-02)]",
        "bg-neutral-100",
        className,
      )}
    >
      <div className="mb-4 grid gap-4 border-b border-neutral-400 pb-4">
        <h2 className="typo-h3">{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};
