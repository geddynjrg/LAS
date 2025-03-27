import type { FC } from "react";

import { cn } from "@workspace/ui/lib/utils";

export interface DescriptionBlockProps {
  className?: string;
  value?: string | null;
  format?: string | null;
  processed?: string | null;
}

export const DescriptionBlock: FC<DescriptionBlockProps> = ({
  className,
  processed,
  value,
}) => {
  return (
    <div
      className={cn("description-block", className)}
      dangerouslySetInnerHTML={{ __html: processed ?? value ?? "" }}
    ></div>
  );
};
