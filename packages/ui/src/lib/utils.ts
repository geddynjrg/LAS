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

// /** get values from form data based on Zod schema */
// export function getFormDataValues<T extends z.Schema>(
//   formData: FormData,
//   schema: T,
// ) {
//   const keys = Array.from(new Set(zodKeys(schema)));
//   for (const [key, value] of formData.entries()) {
//     console.log({ key, value });
//   }
//   const values = keys.reduce(
//     (acc, key) => {
//       console.log({ acc, key });
//       const value = formData.getAll(key);

//       //   if (value.length > 1 || key.endsWith("[]")) {
//       //     return { ...acc, [key]: value };
//       //   }

//       return { ...acc, [key]: value[0] };
//     },
//     {} as Partial<z.infer<T>>,
//   );

//   return values;
// }

export function getFormDataValues<T extends z.Schema>(
  formData: FormData,
  schema: T,
): Partial<z.infer<T>> {
  const values: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    values[key] =
      values[key] !== undefined
        ? Array.isArray(values[key])
          ? [...values[key], value]
          : [values[key], value]
        : value;
  }

  return values as Partial<z.infer<T>>;
}

export function formatBytes(bytes: number, decimals = 2) {
  return prettyBytes(bytes, { maximumFractionDigits: decimals });
}
export function getFormZodDataValues<T extends z.Schema>(
  formData: FormData,
  schema: T,
): Partial<z.infer<T>> {
  const values: Partial<z.infer<T>> = {};

  for (const [key, value] of formData.entries()) {
    const parts = key.match(/([^[\].]+)/g); // Correctly extract keys & indices
    if (!parts) continue;

    let obj: any = values;
    while (parts.length > 1) {
      const part = parts.shift()!;
      const nextPart = parts[0];
      const isArray = /^\d+$/.test(nextPart); // Check if next is an array index

      if (!obj[part]) obj[part] = isArray ? [] : {};
      obj = obj[part];
    }

    const lastPart = parts.shift()!;
    if (Array.isArray(obj[lastPart])) {
      obj[lastPart].push(value);
    } else if (obj[lastPart] !== undefined) {
      obj[lastPart] = [obj[lastPart], value].flat();
    } else {
      obj[lastPart] = value;
    }
  }

  return values as Partial<z.infer<T>>;
}
