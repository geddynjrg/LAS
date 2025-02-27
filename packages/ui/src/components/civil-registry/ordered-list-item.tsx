import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface OrderedListItemWrapProps {
  children: ReactNode;
}

export const OrderedListItemWrap: FC<OrderedListItemWrapProps> = ({
  children,
}) => <ol className={cn("[counter-reset:item]")}>{children}</ol>;

export interface OrderedListItemProps {
  title: string;
  children: string;
}

export const OrderedListItem: FC<OrderedListItemProps> = ({
  title,
  children,
}) => (
  <li
    className={cn(
      "relative min-h-12 pb-5 pl-20",
      "last:pb-0 last:after:hidden",
      "before:bg-stepper before:typo-h4 before:border-3 before:border-primary-active before:text-primary-active before:absolute before:left-0 before:top-0 before:mr-8 before:inline-grid before:h-12 before:w-12 before:items-center before:rounded-full before:border-solid before:text-center before:content-[counter(item)] before:[counter-increment:item]",
      "after:bg-primary-active after:absolute after:bottom-0 after:left-6 after:h-[calc(100%-3rem)] after:w-[3px] after:content-['']",
    )}
  >
    <strong className={cn("block")}>{title}</strong>
    {children}
  </li>
);
