import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

export interface SortIndicatorProps {
  hasSort: boolean;
  order?: string;
}

export const SortIndicator: FC<SortIndicatorProps> = ({ hasSort, order }) => {
  return (
    <div className="relative grid size-6">
      {hasSort && (!order || order.toLowerCase() == "asc") ? (
        <IconChevronUp className="absolute top-0 mx-auto size-3 translate-x-1/2" />
      ) : null}
      {hasSort && (!order || order.toLowerCase() == "desc") ? (
        <IconChevronDown className="absolute bottom-0 size-3 translate-x-1/2" />
      ) : null}
    </div>
  );
};
