import type { FC } from "react";

import {
  Container,
  type ContainerProps,
} from "@workspace/ui/components/container";
import { cn } from "@workspace/ui/lib/utils";

export interface SectionWrapProps extends Omit<ContainerProps, "className"> {
  className?: string;
  hasTopPadding?: boolean;
  hasBottomPadding?: boolean;
  grow?: boolean;
}

export const SectionWrap: FC<SectionWrapProps> = ({
  className,
  hasTopPadding,
  hasBottomPadding,
  grow = true,
  ...props
}) => (
  <Container
    className={cn(
      "px-4",
      hasTopPadding && "pt-7",
      hasBottomPadding && "pb-13",
      grow && "flex-grow",
      className,
    )}
    {...props}
  />
);
