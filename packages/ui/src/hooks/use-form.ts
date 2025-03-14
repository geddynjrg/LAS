"use client";

import { useActionState, useCallback } from "react";
import type { z } from "zod";

import { getFormDataValues } from "@workspace/ui/lib/utils";
import { zodErrorMap } from "@workspace/ui/lib/zod";

export type FormAction<T extends Record<string, unknown>> = (
  prevState: FormActionResponse<T> | null,
  formData: FormData,
) => FormActionResponse<T> | Promise<FormActionResponse<T>>;

export type FormActionResponse<T extends Record<string, unknown>> =
  // initial state
  | {
      success?: undefined;
      errors?: never;
      values: Partial<T>;
    }
  // error state
  | {
      success: false;
      message?: string;
      errors: {
        [K in keyof T]?: (string | z.ZodIssue)[];
      };
      values: Partial<T>;
    }
  // success state
  | ({
      success: true;
      message?: string;
      errors?: never;
      values?: Partial<T>;
    } & Record<string, unknown>);

/**
 * Hook for handling form client-side validation and data submission
 */
export function useForm<
  TSchema extends z.Schema,
  TValues extends z.infer<TSchema>,
>(
  action: FormAction<TValues>,
  schema: TSchema,
  defaultValues: Partial<TValues> = {},
) {
  const formAction = useCallback<FormAction<TValues>>(
    (_prev, formData) => {
      const values = getFormDataValues(formData, schema);
      const { success, error } = schema.safeParse(values, {
        errorMap: zodErrorMap,
      });

      if (!success) {
        const errors = error.flatten((issue) => issue);

        return {
          success,
          errors: errors?.fieldErrors,
          message: errors?.formErrors.map((e) => e.message).join(", "),
          values,
        };
      }

      return action(null, formData);
    },
    [action, schema],
  );

  return useActionState(formAction, { values: defaultValues });
}
