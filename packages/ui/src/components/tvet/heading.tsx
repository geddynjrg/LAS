import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface HeadingProps {
  className?: string;
  children?: ReactNode;
  type?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const Heading: FC<HeadingProps> = ({ className, children, type }) => {
  const Comp = type || "h1";
  return (
    <Comp className={cn("typo-h1 overflow-hidden leading-tight", className)}>
      <span className="after:ml-4 after:mr-[-100%] after:inline-block after:h-[0.5em] after:w-full after:border-t-2 after:align-bottom after:content-['']">
        {children}
      </span>
    </Comp>
  );
};
