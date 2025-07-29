import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { FC } from "react";

export interface SortIndicatorProps {
  direction?: "asc" | "desc" | string;
}

export const SortIndicator: FC<SortIndicatorProps> = ({ direction }) => {
  return (
    <div className="relative grid size-6">
      {!direction || direction.toLowerCase() == "asc" ? (
        <IconChevronUp className="absolute top-0 mx-auto size-3 translate-x-1/2" />
      ) : null}
      {!direction || direction.toLowerCase() == "desc" ? (
        <IconChevronDown className="absolute bottom-0 size-3 translate-x-1/2" />
      ) : null}
    </div>
  );
};
