import { IconX } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface TagProps {
  children?: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export const Tag: FC<TagProps> = ({ children, className, onRemove }) => {
  return (
    <span
      className={cn(
        "typo-body-small border-(--text-foreground) border-1 flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-3 py-0.5",
        className,
      )}
    >
      {children}
      {onRemove && <IconX className="size-4" onClick={onRemove} />}
    </span>
  );
};
