import type { FC } from "react";

import type { DescriptionType } from "@/lib/api/types";

export interface DescriptionBlockProps extends DescriptionType {
  className?: string;
}

export const DescriptionBlock: FC<DescriptionBlockProps> = ({
  className,
  processed,
}) => {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processed }}
    ></div>
  );
};
