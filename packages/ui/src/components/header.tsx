import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface HeaderProps {
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  isFloating?: boolean | "mobile-only";
  children?: ReactNode;
}

export const Header: FC<HeaderProps> = ({
  startDecorator,
  endDecorator,
  isFloating,
  children,
}) => {
  return (
    <header
      className={cn(
        "h-(--header-height) top-0 z-10 flex w-full items-center px-4 shadow-md",
        isFloating === true
          ? "bg-header-foreground/50 text-header fixed backdrop-blur-sm"
          : "bg-header text-header-foreground sticky",

        isFloating === "mobile-only" &&
          "max-md:bg-header-foreground/50 max-md:text-header max-md:fixed max-md:backdrop-blur-sm",
      )}
    >
      <div className="h-[80%] [&>*]:h-full">{startDecorator}</div>

      <div className="flex flex-1 flex-row items-center justify-center">
        {children}
      </div>

      <div className="flex flex-row items-center justify-center gap-4">
        {endDecorator}
      </div>
    </header>
  );
};
