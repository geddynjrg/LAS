import { clsx, type ClassValue } from "clsx";
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
  const keys = zodKeys(schema);

  return Object.fromEntries(
    keys.map((key) => [key, formData.get(key)]),
  ) as Partial<z.infer<T>>;
}
