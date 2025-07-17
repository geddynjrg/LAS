import { clsx, type ClassValue } from "clsx";
import prettyBytes from "pretty-bytes";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

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
export function assertNever(value: never, noThrow?: boolean): never {
  if (noThrow) {
    console.error(
      `Unhandled discriminated union member: ${JSON.stringify(value)}`,
    );
    return null as never;
  }
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
  _schema: T,
): Partial<z.infer<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  _schema: T,
): Partial<z.infer<T>> {
  const values: Partial<z.infer<T>> = {};

  for (const [key, value] of formData.entries()) {
    const parts = key.match(/([^[\].]+)/g); // Correctly extract keys & indices
    if (!parts) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function isValueChanged<T extends Partial<object>>(
  field: keyof T,
  newValues?: T,
  oldValues?: T,
) {
  // If defaultValues is not provided, then we cannot determine if the value has changed
  if (!oldValues || !(field in oldValues)) {
    return false;
  }

  // Get the value from the state and defaultValues
  // Use nullish coalescing operator to handle undefined values
  const currentValue = newValues?.[field] ?? "";
  const defaultValue = oldValues[field] ?? "";

  return currentValue !== defaultValue;
}

/**
 * A function that merges React refs into one.
 */
export default function mergeRefs<T>(
  ...inputRefs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
  const filteredInputRefs = inputRefs.filter(Boolean);

  if (filteredInputRefs.length <= 1) {
    const firstRef = filteredInputRefs[0];

    return firstRef || null;
  }

  return function mergedRefs(ref) {
    for (const inputRef of filteredInputRefs) {
      if (typeof inputRef === "function") {
        inputRef(ref);
      } else if (inputRef) {
        (inputRef as React.MutableRefObject<T | null>).current = ref;
      }
    }
  };
}

export async function fileToBase64(
  file: File,
): Promise<{ data: string; filename: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    data: `data:${file.type};base64,${btoa(binary)}`,
    filename: file.name,
  };
}

export async function prepareFileForUpload<T>(file: T) {
  if (typeof File !== "undefined" && file instanceof File) {
    return fileToBase64(file);
  }

  // return file as Exclude<T, File>; // TODO: fix this type once api is fixed
  return file as unknown as { data: string; filename: string };
}

/**
 * Check if a value is a file upload (has file-like properties)
 * Works for both File objects and FormDataEntryValue in server actions
 */
export function isFileUpload(
  value: unknown,
): value is File | FormDataEntryValue {
  return (
    value !== null &&
    typeof value === "object" &&
    "name" in value &&
    "size" in value &&
    "type" in value &&
    typeof (value as unknown as { size: number }).size === "number" &&
    (value as unknown as { size: number }).size > 0
  );
}
