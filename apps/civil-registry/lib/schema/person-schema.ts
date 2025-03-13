import { z } from "zod";

// import type { Person } from "@/lib/data/persons";

export const sexTypeSchema = z.enum(["M", "F"]);
export const validationStatusSchema = z
  .enum(["alert", "success", "pending", "rejected"])
  .optional();

const basePersonSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  sex: sexTypeSchema,
  dob: z.string(),
  validationStatus: validationStatusSchema,
  age: z.string().optional(),
  weightOnBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  citizenship: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  education: z.string().optional(),
  phone: z.string().optional(),
  phoneCode: z.string().optional(),
});

// Schema with recursive relations
export const personSchema: z.ZodType<any> = basePersonSchema.extend({
  father: z.lazy(() => personSchema).optional(),
  mother: z.lazy(() => personSchema).optional(),
  siblings: z.array(z.lazy(() => personSchema)).optional(),
  children: z.array(z.lazy(() => personSchema)).optional(),
  spouse: z.lazy(() => personSchema).optional(),
});

// Schema where `mother` and `father` are just strings
export const personFormSchema = z.object({
  id: z.string(),
  firstName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  lastName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  middleName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  sex: sexTypeSchema
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  dob: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  age: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  weightOnBirth: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  placeOfBirth: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  nationalId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  citizenship: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  nationality: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  maritalStatus: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  education: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  phoneCode: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  father: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  mother: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});

export type Person = z.infer<typeof personSchema>;
export type PersonForm = z.infer<typeof personFormSchema>;
