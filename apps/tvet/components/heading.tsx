import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface HeadingProps {
  className?: string;
  children?: ReactNode;
}

export const Heading: FC<HeadingProps> = ({ className, children }) => {
  return (
    <h1
      className={cn(
        "overflow-hidden text-[2.75rem] font-bold leading-tight",
        className,
      )}
    >
      <span className="after:ml-4 after:mr-[-100%] after:inline-block after:h-[0.5em] after:w-full after:border-t-2 after:border-inherit after:align-bottom after:content-['']">
        {children}
      </span>
    </h1>
  );
};
