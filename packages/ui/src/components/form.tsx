import * as FormPrimitive from "@radix-ui/react-form";
import { useTranslations, type TranslationValues } from "next-intl";
import { useId, type FC, type ReactNode } from "react";
import type { z } from "zod";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { labelVariants } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import type { FlattenObjectKeys } from "@workspace/ui/types";

export const Form = FormPrimitive.Root;

export interface FormFieldState<T extends Record<string, unknown>> {
  values?: Partial<T>;
  errors?: { [K in keyof T]?: (string | z.ZodIssue)[] };
}

export interface FieldControlProps<TName, TValue> {
  id: string;
  name: TName;
  defaultValue?: TValue;
}

export interface FieldProps<
  TInputs extends Record<string, unknown>,
  TName extends Extract<keyof TInputs, unknown>,
> {
  control: (props: FieldControlProps<TName, TInputs[TName]>) => ReactNode;
  name: TName;
  state?: FormFieldState<TInputs>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  className?: string;
}

export const Field = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this allows using <Field /> without the 'state' prop
  TInputs extends Record<string, any>,
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
  const t = useTranslations();

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
        {control({ id, name, defaultValue })}
      </FormPrimitive.Control>

      {errorMessage && (
        <FieldMessage>
          {typeof errorMessage === "string"
            ? errorMessage
            : t.has(errorMessage.message as FlattenObjectKeys<IntlMessages>)
              ? t(
                  errorMessage.message as FlattenObjectKeys<IntlMessages>,
                  errorMessage as unknown as TranslationValues,
                )
              : errorMessage.message}
        </FieldMessage>
      )}

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
