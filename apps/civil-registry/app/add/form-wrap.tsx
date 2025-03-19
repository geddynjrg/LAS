import type { ComponentProps, FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Form } from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import {
  FormActionBar,
  type FormActionBarProps,
} from "@/app/add/form-action-bar";

export interface FormWrapProps extends FormActionBarProps {
  action?: ComponentProps<typeof Form>["action"];
  className?: string;
  children?: ReactNode;
}

export const FormWrap: FC<FormWrapProps> = ({
  className,
  children,
  action,
  ...props
}) => {
  return (
    <Form className="flex flex-1 flex-col" action={action}>
      <Container className={cn("mt-4 flex-1", className)}>{children}</Container>
      <FormActionBar {...props} />
    </Form>
  );
};
