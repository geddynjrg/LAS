import { clsx, type ClassValue } from "clsx";
import prettyBytes from "pretty-bytes";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

import { zodKeys } from "@workspace/ui/lib/zod";

export * from "cva-extended";

/**
 * Merges class names with Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Asserts that a value is never reached. Useful for exhaustiveness checks.
 */
export function assertNever(value: never): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`,
  );
}

/** get values from form data based on Zod schema */
export function getFormDataValues<T extends z.Schema>(
  formData: FormData,
  schema: T,
) {
  const keys = Array.from(new Set(zodKeys(schema)));

  const values = keys.reduce(
    (acc, key) => {
      const value = formData.getAll(key);

      if (value.length > 1 || key.endsWith("[]")) {
        return { ...acc, [key]: value };
      }

      return { ...acc, [key]: value[0] };
    },
    {} as Partial<z.infer<T>>,
  );

  return values;
}

export function formatBytes(bytes: number, decimals = 2) {
  return prettyBytes(bytes, { maximumFractionDigits: decimals });
}
