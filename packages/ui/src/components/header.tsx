import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface HeaderProps {
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  isFloating?: boolean | "mobile-only";
  className?: string;
  children?: ReactNode;
}

export const Header: FC<HeaderProps> = ({
  startDecorator,
  endDecorator,
  isFloating,
  className,
  children,
}) => {
  return (
    <header
      className={cn(
        "h-(--header-height,4.5rem) left-0 right-0 top-0 z-20 flex items-center px-4 shadow-md",
        isFloating === true
          ? "bg-header-foreground/50 text-header !right-(--removed-body-scroll-bar-size,0) fixed backdrop-blur-sm"
          : "bg-header text-header-foreground sticky",

        isFloating === "mobile-only" &&
          "max-md:bg-header-foreground/50 max-md:text-header max-md:fixed max-md:backdrop-blur-sm",
        className,
      )}
    >
      <div className="h-[90%] [&>*]:h-full">{startDecorator}</div>

      <div className="flex flex-1 flex-row items-center justify-center">
        {children}
      </div>

      <div className="flex flex-row items-center justify-center gap-4">
        {endDecorator}
      </div>
    </header>
  );
};
