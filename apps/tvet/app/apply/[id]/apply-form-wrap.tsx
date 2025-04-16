import type { ComponentProps, FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Form } from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import {
  ApplyFormActionBar,
  type ApplyFormActionBarProps,
} from "@/app/apply/[id]/apply-form-action-bar";

export interface ApplyFormWrapProps extends ApplyFormActionBarProps {
  action?: ComponentProps<typeof Form>["action"];
  isPending?: boolean;
  className?: string;
  children?: ReactNode;
}

export const ApplyFormWrap: FC<ApplyFormWrapProps> = ({
  className,
  children,
  action,
  isPending,
  submitType,
  ...props
}) => {
  return (
    <Form className="flex flex-1 flex-col" action={action}>
      <Container className={cn("mt-4 flex-1", className)}>{children}</Container>
      <ApplyFormActionBar
        {...props}
        submitType={isPending ? "disabled" : submitType}
      />
    </Form>
  );
};
