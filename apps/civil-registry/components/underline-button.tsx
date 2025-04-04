import type { FC, ReactNode } from "react";

import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

export interface UnderlineButtonProps {
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export const UnderlineButton: FC<UnderlineButtonProps> = ({
  className,
  ...props
}) => {
  return (
    <Underline variant="link" asChild>
      <button
        className={cn("text-link cursor-pointer text-base", className)}
        type="button"
        {...props}
      />
    </Underline>
  );
};
