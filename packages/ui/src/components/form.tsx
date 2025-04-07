"use client";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputValues = Record<string, any>;

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

export interface FormFieldError {
  _errors?: string[]; // Field-level errors
  children?: { [key: string]: FormFieldError }; // Nested errors
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
  control:
    | ((props: FieldControlProps<TName, Path<TInputs>>) => ReactNode)
    | null;
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
  TInputs extends InputValues,
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

  const errorMessage = getErrorMessage(name, state);
  const defaultValues = getFormValue(name, state);

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
          {required && editable && <span className="text-destructive">*</span>}
        </FormPrimitive.Label>
      )}
      {isVisible ? (
        editable ? (
          <FormPrimitive.Control asChild>
            {control &&
              control({
                id,
                name,
                defaultValue: defaultValues,
              })}
          </FormPrimitive.Control>
        ) : (
          <p>
            <input type="hidden" name={name} value={defaultValues} />
            {isDate &&
            defaultValues &&
            (typeof defaultValues === "string" ||
              typeof defaultValues === "number")
              ? format.dateTime(new Date(defaultValues))
              : (defaultValues ?? "–")}
          </p>
        )
      ) : (
        <input type="hidden" name={name} value={defaultValues} />
      )}

      {errorMessage && (
        <FieldMessage>
          {typeof errorMessage === "string"
            ? errorMessage
            : t.has(errorMessage?.message as FlattenObjectKeys<IntlMessages>)
              ? t(
                  errorMessage?.message as FlattenObjectKeys<IntlMessages>,
                  errorMessage as unknown as TranslationValues,
                )
              : errorMessage?.message}
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

const getFormValue = <TInputs extends InputValues, TName extends keyof TInputs>(
  fieldName: TName,
  state?: { values?: FormFieldState<TInputs>["values"] },
) => {
  const pathParts =
    typeof fieldName === "string" ? fieldName.split(".") : [fieldName];
  const name = pathParts.shift();

  if (!state?.values || !name) {
    return undefined;
  }

  let value = state.values[name];

  // Return value if we are at the end of the path
  if (pathParts.length === 0) {
    return value;
  }

  // If the value is an array, we need to return the value at the index
  if (Array.isArray(value)) {
    const indexStr = pathParts.shift();
    const index = indexStr ? parseInt(indexStr.toString(), 10) : undefined;

    if (typeof index !== "number" || isNaN(index)) {
      return undefined;
    }

    value = value[index];
  }

  // If the value is an object, we need to return the value at the key
  if (typeof value === "object" && value !== null) {
    return getFormValue(pathParts.join("."), {
      values: value,
    });
  }

  return value;
};

const getErrorMessage = <
  TInputs extends InputValues,
  TName extends keyof TInputs,
>(
  fieldName: TName,
  state?: { errors?: FormFieldState<TInputs>["errors"] | undefined },
) => {
  const pathParts = (
    typeof fieldName === "string" ? fieldName.split(".") : [fieldName]
  ) as TName[];
  const name = pathParts.shift();

  if (!state?.errors || !name) {
    return undefined;
  }

  const rootError = state.errors[name];

  // check if is nested error
  if (Array.isArray(rootError)) {
    const childError = rootError.find((e) => {
      if (typeof e === "string") {
        return false;
      }

      return e.path.join(".") === fieldName;
    });

    return childError;
  }

  return rootError as string | z.ZodIssue | undefined;
};
