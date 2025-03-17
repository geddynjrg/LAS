import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { cn } from "@workspace/ui/lib/utils";

import {
  ApplyFormActionBar,
  type ApplyFormActionBarProps,
} from "@/app/apply/[id]/apply-form-action-bar";

export interface ApplyFormWrapProps extends ApplyFormActionBarProps {
  className?: string;
  children?: ReactNode;
}

export const ApplyFormWrap: FC<ApplyFormWrapProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className="flex flex-1 flex-col">
      <Container className={cn("flex-1", className)}>{children}</Container>
      <ApplyFormActionBar {...props} />
    </div>
  );
};
