import * as FormPrimitive from "@radix-ui/react-form";
import { useId, type FC, type ReactNode } from "react";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { labelVariants } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";

export const Form = FormPrimitive.Root;

interface FormFieldState<T extends Record<string, string>> {
  values?: T;
  errors?: { [K in keyof T]?: string[] | undefined };
}

export interface FieldControlProps<K extends string> {
  id: string;
  name: K;
  required?: boolean;
  defaultValue?: string;
}

export interface FieldProps<
  TInputs extends Record<string, string>,
  TName extends Extract<keyof TInputs, string>,
> {
  control: (props: FieldControlProps<TName>) => ReactNode;
  name: TName;
  state?: FormFieldState<TInputs>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  className?: string;
}

export const Field = <
  TInputs extends Record<string, string>,
  TName extends Extract<keyof TInputs, string>,
>({
  state,
  name,
  label,
  description,
  control,
  required,
  className,
}: FieldProps<TInputs, TName>) => {
  const id = useId();
  const descId = description ? `${id}-message` : undefined;

  const defaultValue = state?.values?.[name];
  const errorMessage = state?.errors?.[name]?.[0];

  return (
    <FormPrimitive.Field
      name={name}
      className={cn(className, "flex w-full flex-col gap-1")}
      serverInvalid={!!errorMessage}
    >
      {label && (
        <FormPrimitive.Label
          htmlFor={id}
          className={cn(labelVariants(), "mb-1 font-bold")}
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </FormPrimitive.Label>
      )}

      <FormPrimitive.Control asChild>
        {control({ id, name, defaultValue, required })}
      </FormPrimitive.Control>

      {required && !errorMessage && (
        <FieldMessage match="valueMissing">This field is required</FieldMessage>
      )}

      {errorMessage && <FieldMessage>{errorMessage}</FieldMessage>}

      {description && (
        <p id={descId} className="typo-body-small text-border">
          {description}
        </p>
      )}
    </FormPrimitive.Field>
  );
};

const FieldMessage: FC<{
  match?: FormPrimitive.FormMessageProps["match"];
  className?: string;
  children?: ReactNode;
}> = ({ className, ...props }) => {
  return (
    <FormPrimitive.Message
      className={cn("text-destructive typo-body-small", className)}
      {...props}
    />
  );
};

export const SubmitButton: FC<ButtonProps> = (props) => {
  return (
    <FormPrimitive.Submit asChild>
      <Button {...props} />
    </FormPrimitive.Submit>
  );
};
