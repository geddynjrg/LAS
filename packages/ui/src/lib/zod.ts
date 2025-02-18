import { z } from "zod";

/**
 * Custom error map for Zod schemas
 */
export const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  // required error message
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return { message: "InputErrors.required" };
  }

  // too small error message
  if (issue.code === z.ZodIssueCode.too_small) {
    // show required error message if z.string().trim().min(1)
    if (issue.type === "string" && issue.minimum === 1) {
      return { message: "InputErrors.required" };
    }

    return {
      message: "InputErrors.tooSmall",
      params: { min: issue.minimum },
    };
  }

  // too big error message
  if (issue.code === z.ZodIssueCode.too_big) {
    return { message: "InputErrors.tooBig" };
  }

  return { message: ctx.defaultError };
};

/** get zod object keys recursively  */
export const zodKeys = <T extends z.ZodTypeAny>(schema: T): string[] => {
  // make sure schema is not null or undefined
  if (schema === null || schema === undefined) return [];
  // check if schema is nullable or optional
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional)
    return zodKeys(schema.unwrap());
  // check if schema is an array
  if (schema instanceof z.ZodArray) return zodKeys(schema.element);
  // check if schema is an object
  if (schema instanceof z.ZodObject) {
    // get key/value pairs from schema
    const entries = Object.entries(schema.shape);
    // loop through key/value pairs
    return entries.flatMap(([key, value]) => {
      // get nested keys
      const nested =
        value instanceof z.ZodType
          ? zodKeys(value).map((subKey) => `${key}.${subKey}`)
          : [];
      // return nested keys
      return nested.length ? nested : key;
    });
  }
  // return empty array
  return [];
};
