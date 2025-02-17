import type { FC, ReactNode } from "react";

import { BulletBox } from "@workspace/ui/components/bullet-box";
import { cn } from "@workspace/ui/lib/utils";

export interface IconBlockProps {
  title: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const IconBlock: FC<IconBlockProps> = ({
  title,
  children,
  className,
  icon,
}) => {
  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
    >
      {icon && <BulletBox>{icon}</BulletBox>}
      <h2 className="typo-h5">{title}</h2>
      <div>{children}</div>
    </div>
  );
};
