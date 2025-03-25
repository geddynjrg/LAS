/* eslint-disable @typescript-eslint/no-explicit-any */
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
  errors?: {
    _errors?: string[]; // Global form-level errors
  } & {
    [K in keyof T]?: (string | z.ZodIssue)[] | FormFieldError;
  };
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

const getFormValue = <TInputs extends Record<string, any>>(
  fieldName: string,
  state?: { values?: Partial<TInputs> },
): TInputs[keyof TInputs] | undefined => {
  if (!state?.values) return undefined;

  // First check for direct field value
  let fieldValue = state.values[fieldName] as
    | TInputs[keyof TInputs]
    | undefined;

  // Check if values contain a "children" structure
  if (state.values.children) {
    const parts = fieldName.split(".");
    const fieldKey = parts.pop();
    const index = parseInt(parts[1] ?? "0", 10);

    if (!isNaN(index) && state.values.children[index]) {
      fieldValue = state.values.children[index][fieldKey!] as
        | TInputs[keyof TInputs]
        | undefined;
    }
  }

  const parts = fieldName.split(".");
  const name = parts[0];
  const fieldKey = parts.pop();
  const index = parseInt(parts[1] ?? "0", 10);

  if (
    name !== undefined &&
    typeof state.values[name] === "object" &&
    state.values[name] !== null
  ) {
    if (!isNaN(index) && state.values[name][index]) {
      if (
        (fieldKey !== undefined && state.values[name][index][fieldKey]) ||
        typeof state.values[name][index] === "object"
      ) {
        fieldValue = state.values[name][index][fieldKey!] as
          | TInputs[keyof TInputs]
          | undefined;
      } else {
        fieldValue = state.values[name] as TInputs[keyof TInputs] | undefined;
      }
    }
  }

  // Handle case where field itself has "children"
  if (
    fieldValue &&
    typeof fieldValue === "object" &&
    "children" in fieldValue
  ) {
    return (fieldValue as { children?: any }).children;
  }

  return fieldValue;
};

const getErrorMessage = <TInputs extends Record<string, any>>(
  fieldName: string,
  state: FormFieldState<TInputs> | undefined,
): string | undefined | { errorMessage: string; name: string } => {
  if (!state?.errors) return undefined;

  // Split fieldName into path segments (e.g., "contacts.children.0.email" → ["contacts", "children", "0", "email"])
  const pathParts = fieldName.split(".");
  let errorEntry: any = state.errors;

  // Traverse the nested error structure dynamically
  for (const part of pathParts) {
    if (!errorEntry || typeof errorEntry !== "object") return undefined;
    errorEntry = errorEntry[part]; // Go deeper into the object
  }

  // Case 1: Return the first _errors entry as a string
  if (Array.isArray(errorEntry?._errors) && errorEntry._errors.length > 0) {
    return { errorMessage: errorEntry._errors[0], name: fieldName };
  }

  // Case 2: If errorEntry is an array (e.g., fieldErrors as an array), return the first entry
  if (Array.isArray(errorEntry) && errorEntry.length > 0) {
    return { errorMessage: errorEntry[0], name: fieldName };
  }

  return undefined;
};

export const Field = <
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
          {required && <span className="text-destructive">*</span>}
        </FormPrimitive.Label>
      )}
      {isVisible ? (
        editable ? (
          <FormPrimitive.Control asChild>
            {control({
              id,
              name,
              defaultValue: defaultValues,
            })}
          </FormPrimitive.Control>
        ) : (
          <p>
            <input type="hidden" name={name} value={defaultValues} />
            {isDate && defaultValues
              ? format.dateTime(new Date(defaultValues))
              : (defaultValues ?? "–")}
          </p>
        )
      ) : (
        <input type="hidden" name={name} value={defaultValues} />
      )}

      {typeof errorMessage === "object" &&
        typeof errorMessage?.errorMessage === "string" && (
          <FieldMessage>
            {(() => {
              const messageKey = errorMessage.errorMessage;
              if (
                typeof messageKey === "string" &&
                t.has(messageKey as FlattenObjectKeys<IntlMessages>)
              ) {
                return t(
                  messageKey as FlattenObjectKeys<IntlMessages>,
                  errorMessage as unknown as TranslationValues,
                );
              }
              return messageKey; // Fallback to displaying raw message
            })()}
          </FieldMessage>
        )}

      {/* {errorMessage && (
        <FieldMessage>
          {typeof errorMessage === "string"
            ? errorMessage
            : (() => {
                // Ensure errorMessage.message is a string before translation
                const messageKey = errorMessage?.message;
                if (
                  typeof messageKey === "string" &&
                  t.has(messageKey as FlattenObjectKeys<IntlMessages>)
                ) {
                  return t(
                    messageKey as FlattenObjectKeys<IntlMessages>,
                    errorMessage as unknown as TranslationValues,
                  );
                }

                return messageKey; // Fallback to displaying raw message
              })()}
        </FieldMessage>
      )} */}

      {typeof errorMessage === "string" && errorMessage && (
        <FieldMessage>
          {typeof errorMessage === "string" &&
          t.has(errorMessage as FlattenObjectKeys<IntlMessages>)
            ? errorMessage
            : t.has(errorMessage as FlattenObjectKeys<IntlMessages>)
              ? t(
                  errorMessage as FlattenObjectKeys<IntlMessages>,
                  errorMessage as unknown as TranslationValues,
                )
              : errorMessage}
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
