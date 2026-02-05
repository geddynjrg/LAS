import type { Messages } from "next-intl";
import type { Accept } from "react-dropzone";
import { z } from "zod";

/**
 * Map zod errors to translation keys
 */
export const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case "custom": {
      return issue.message
        ? { message: issue.message, params: issue }
        : getIntlKey("invalid");
    }

    case "too_small": {
      if (!issue.minimum || issue.minimum <= 1) {
        return getIntlKey("required");
      }

      if (issue.type === "string") {
        return getIntlKey("string_too_small", issue);
      }

      if (issue.type === "date") {
        return getIntlKey("date_too_small", issue);
      }

      return getIntlKey("number_too_small", issue);
    }

    case "too_big": {
      if (issue.type === "string") {
        return getIntlKey("string_too_large", issue);
      }

      if (issue.type === "date") {
        return getIntlKey("date_too_large", issue);
      }

      if (issue.type === "array") {
        return getIntlKey("array_too_large", issue);
      }

      return getIntlKey("number_too_large", issue);
    }

    case "invalid_union": {
      if (!ctx.data) {
        return getIntlKey("required");
      }

      return getIntlKey("invalid_union", issue);
    }

    case "invalid_date": {
      return getIntlKey("invalid_date", issue);
    }

    case "invalid_enum_value": {
      if (issue.received === "") {
        return getIntlKey("required");
      }

      return { message: ctx.defaultError };
    }

    default:
      return { message: ctx.defaultError };
  }
};

/** get zod object keys recursively  */
export const zodKeys = <T extends z.ZodTypeAny>(schema: T): string[] => {
  const paths = new Set<string>();

  const extractPaths = (schema: z.ZodType, prefix: string = "") => {
    if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
      extractPaths(schema.unwrap(), prefix);
      return;
    }
    if (schema instanceof z.ZodArray) {
      extractPaths(schema.element, prefix);
      return;
    }
    if (schema instanceof z.ZodDiscriminatedUnion) {
      Array.from(schema.optionsMap.values()).forEach((option) =>
        extractPaths(option, prefix),
      );
      return;
    }
    if (schema instanceof z.ZodEffects) {
      extractPaths(schema._def?.schema ?? schema, prefix);
      return;
    }
    if (schema instanceof z.ZodObject) {
      Object.entries<z.ZodType>(schema.shape).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        extractPaths(value, newPrefix);
      });
      return;
    }
    if (prefix) {
      paths.add(prefix);
    }
  };

  extractPaths(schema);
  return Array.from(paths);
};

export function checkbox(required = false) {
  return z.preprocess(
    (value) => value === "on",
    required
      ? z.literal(true, { errorMap: () => getIntlKey("required") })
      : z.boolean(),
  );
}

export function phoneNumber(required = true) {
  const baseSchema = z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .pipe(
      z.string().regex(
        /^\+[1-9]\d{7,15}$/,
        getIntlKey("invalid"),
      ),
    );

  if (required) {
    return z
      .string()
      .min(1, getIntlKey("required"))
      .transform((val) => val.replace(/\s+/g, ""))
      .pipe(
        z.string().regex(
          /^\+[1-9]\d{7,15}$/,
          getIntlKey("invalid"),
        ),
      );
  }

  return baseSchema.optional();
}

export function validFile(accept: Accept, fileSize: number) {
  // File-like object schema (works for both File objects and FormDataEntryValue)
  const fileSchema = z
    .custom<File | FormDataEntryValue>((value) => {
      // Check if it's a file-like object with required properties
      return (
        value !== null &&
        typeof value === "object" &&
        "name" in value &&
        "size" in value &&
        "type" in value &&
        typeof (value as unknown as { size: number }).size === "number"
      );
    }, getIntlKey("required"))
    // check if file exists and has content
    .refine(
      (file) => (file as unknown as { size: number }).size > 0,
      getIntlKey("required"),
    )
    // check that file is not too large
    .refine(
      (file) => (file as unknown as { size: number }).size <= fileSize,
      getIntlKey("file_too_large", { maximum: fileSize } as z.ZodIssue),
    )
    // check that file is one of the accepted types
    .refine(
      (file) =>
        expandMimeTypes(accept).includes(
          (file as unknown as { type: string }).type,
        ),
      getIntlKey("invalid"),
    );

  return z.union([
    fileSchema,
    z.object({
      fid: z.coerce.number().optional(),
      filename: z.string().optional(),
      url: z.string().optional(),
    }),
  ]);
}

export type ValidFile = z.infer<ReturnType<typeof validFile>>;

function getIntlKey<T extends z.ZodIssueBase>(
  key: keyof Messages["Form"]["errors"],
  params?: T,
): { message: string; params?: T } {
  return { message: `Form.errors.${String(key)}`, params };
}

function expandMimeTypes(accept: Accept) {
  const mimeTypes = Object.entries(accept).flatMap(([key, value]) => {
    if (key.includes("/*")) {
      const mimeType = key.split("/")[0];

      return value.map((v) => `${mimeType}/${v.replace(".", "")}`);
    }

    return key;
  });

  return mimeTypes;
}
