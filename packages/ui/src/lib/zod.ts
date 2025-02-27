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

    default:
      return { message: ctx.defaultError };
  }
};

/** get zod object keys recursively  */
export const zodKeys = <T extends z.ZodTypeAny>(schema: T): string[] => {
  // make sure schema is not null or undefined
  if (schema === null || schema === undefined) {
    return [];
  }

  // check if schema is nullable or optional
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional) {
    return zodKeys(schema.unwrap());
  }

  // check if schema is an array
  if (schema instanceof z.ZodArray) {
    return zodKeys(schema.element);
  }

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

function getIntlKey<T extends z.ZodIssueBase>(
  key: keyof IntlMessages["Form"]["errors"],
  params?: T,
): { message: string; params?: T } {
  return { message: `Form.errors.${key}`, params };
}
