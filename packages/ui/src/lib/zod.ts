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

      return getIntlKey("number_too_large", issue);
    }

    case "invalid_union": {
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

  const extractPaths = (schema: Zod.ZodType, prefix: string = "") => {
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

export function validFile(accept: Accept, fileSize: number) {
  return z.union([
    z
      .instanceof(File)
      // check if file exists
      .refine((file) => file && file.size > 0, getIntlKey("required"))
      // check that file is not too large
      .refine(
        (file) => file.size <= fileSize,
        getIntlKey("file_too_large", { maximum: fileSize } as z.ZodIssue),
      )
      // check that file is one of the accepted types
      .refine(
        (file) => expandMimeTypes(accept).includes(file.type),
        getIntlKey("invalid"),
      ),
    z.object({
      fid: z.coerce.number(),
      filename: z.string(),
      url: z.string().optional(),
    }),
  ]);
}

export type ValidFile = z.infer<ReturnType<typeof validFile>>;

function getIntlKey<T extends z.ZodIssueBase>(
  key: keyof IntlMessages["Form"]["errors"],
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
