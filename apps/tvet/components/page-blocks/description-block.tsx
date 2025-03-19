import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

import type { DescriptionType } from "@/lib/api/types";

export interface DescriptionBlockProps extends DescriptionType {
  className?: string;
}

export const DescriptionBlock: FC<DescriptionBlockProps> = ({
  className,
  processed,
  value,
}) => {
  return (
    <div
      className={cn("description-block", className)}
      dangerouslySetInnerHTML={{ __html: processed ?? value }}
    ></div>
  );
};
