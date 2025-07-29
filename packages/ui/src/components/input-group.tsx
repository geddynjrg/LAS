import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface InputGroupProps {
  className?: string;
  children?: ReactNode;
}

export const InputGroup: FC<InputGroupProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        // align children to row and take up equal space
        "flex [&>*]:w-full",
        // remove one of the borders from two adjacent elements
        "[&>*+*]:border-l-0 [&>*+*_button[role=combobox]]:border-l-0 [&>*+*_input]:border-l-0",
        // remove left radius from all but the first element
        "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)_button[role=combobox]]:rounded-l-none [&>*:not(:first-child)_input]:rounded-l-none",
        // remove right radius from all but the last element
        "[&>*:not(:last-child)]:rounded-r-none [&>*:not(:last-child)_button[role=combobox]]:rounded-r-none [&>*:not(:last-child)_input]:rounded-r-none",
        // ensure focus-visible ring is not behind the adjacent element
        "[&>*:focus-visible]:z-10 [&>*_input:focus-visible]:z-10",
        className,
      )}
      {...props}
    />
  );
};
