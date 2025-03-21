import * as FormPrimitive from "@radix-ui/react-form";
import {
  useFormatter,
  useTranslations,
  type TranslationValues,
} from "next-intl";
import { useId, type FC, type ReactNode } from "react";
import type { z } from "zod";

import { Button, type ButtonProps } from "@workspace/ui/components/button";
import { InputGroup } from "@workspace/ui/components/input-group";
import { labelVariants } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import type { FlattenObjectKeys } from "@workspace/ui/types";

export const Form = FormPrimitive.Root;

export type Path<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends Array<infer U>
        ? `${Extract<K, string>}.${number}.${Path<U>}` | Extract<K, string>
        : T[K] extends object
          ? `${Extract<K, string>}.${Path<T[K]>}` | Extract<K, string>
          : Extract<K, string>;
    }[keyof T]
  : never;

export interface FormFieldState<T extends Record<string, unknown>> {
  values?: Partial<T>;
  errors?: { [K in keyof T]?: (string | z.ZodIssue)[] };
}

export interface FieldControlProps<TName, TValue = string> {
  id: string;
  name: TName;
  defaultValue?: TValue extends boolean
    ? boolean | "on" | null | undefined
    : TValue;
}

export interface FieldProps<
  TInputs extends Record<string, unknown>,
  TName extends Path<TInputs>,
> {
  control: (props: FieldControlProps<TName, Path<TInputs>>) => ReactNode;
  name: TName;
  state?: FormFieldState<TInputs>;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  editable?: boolean;
  isVisible?: boolean;
  isDate?: boolean;
  className?: string;
}

export const Field = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this allows using <Field /> without the 'state' prop
  TInputs extends Record<string, any>,
  TName extends Path<TInputs>,
>({
  state,
  name,
  label,
  description,
  control,
  required,
  editable = true,
  isVisible = true,
  isDate = false,
  className,
}: FieldProps<TInputs, TName>) => {
  const id = useId();
  const t = useTranslations();
  const format = useFormatter();

  const descId = description ? `${id}-message` : undefined;

  let defaultValue = state?.values?.[name] as TInputs[TName] | undefined;
  let errorMessage = undefined;

  if (state?.values?.children) {
    const parts = name.split(".");
    const fieldName = parts.pop();

    const index = parseInt(parts[1] ?? "0", 10);

    if (!isNaN(index) && state.values.children[index]) {
      defaultValue = state.values.children[index][fieldName!] as
        | TInputs[TName]
        | undefined;
    }
  }

  if (state?.errors?.children) {
    const parts = name.split(".");
    const fieldName = parts.pop();
    const index = parseInt(parts[1] ?? "0", 10);
    const findErrorMessage = state.errors.children.find(
      (err): err is z.ZodIssue =>
        typeof err === "object" &&
        "path" in err &&
        Array.isArray(err.path) &&
        err.path.includes(index) &&
        err.path.includes(fieldName ?? name),
    );

    errorMessage = findErrorMessage;
  } else {
    errorMessage = state?.errors?.[name]?.[0];
  }

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
      {isVisible ? (
        editable ? (
          <FormPrimitive.Control asChild>
            {control({
              id,
              name,
              defaultValue,
            })}
          </FormPrimitive.Control>
        ) : (
          <p>
            <input type="hidden" name={name} value={defaultValue} />
            {isDate && defaultValue
              ? format.dateTime(new Date(defaultValue))
              : (defaultValue ?? "–")}
          </p>
        )
      ) : (
        <input type="hidden" name={name} value={defaultValue} />
      )}

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
        <FieldDescription id={descId}>{description}</FieldDescription>
      )}
    </FormPrimitive.Field>
  );
};

export interface FieldGroupProps {
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  className?: string;
  children?: ReactNode;
}

export const FieldGroup: FC<FieldGroupProps> = ({
  label,
  description,
  required,
  className,
  children,
}) => (
  <div className={cn("space-y-1", className)}>
    {label && (
      <div className={cn(labelVariants(), "mb-2 font-bold")}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </div>
    )}
    <InputGroup>{children}</InputGroup>

    {description && <FieldDescription>{description}</FieldDescription>}
  </div>
);

export const SubmitButton: FC<ButtonProps> = (props) => (
  <FormPrimitive.Submit asChild>
    <Button {...props} />
  </FormPrimitive.Submit>
);

const FieldDescription: FC<{ id?: string; children?: ReactNode }> = (props) => (
  <p className="typo-body-small text-border" {...props} />
);

const FieldMessage: FC<{
  match?: FormPrimitive.FormMessageProps["match"];
  className?: string;
  children?: ReactNode;
}> = ({ className, ...props }) => (
  <FormPrimitive.Message
    className={cn("text-destructive typo-body-small", className)}
    {...props}
  />
);
