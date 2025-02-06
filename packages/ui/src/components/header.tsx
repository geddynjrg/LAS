import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface HeaderProps {
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  isFloating?: boolean;
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
        "text-header-foreground h-(--header-height) top-0 z-10 flex w-full items-center px-4 shadow-md",
        isFloating
          ? "bg-foreground/50 fixed backdrop-blur-sm"
          : "bg-header sticky",
      )}
    >
      <div className="h-[80%] [&>*]:h-full">{startDecorator}</div>

      <div className="flex flex-1 flex-row items-center justify-center">
        {children}
        {/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
      </div>

      <div className="flex flex-row items-center justify-center">
        {endDecorator}
      </div>
    </header>
  );
};
