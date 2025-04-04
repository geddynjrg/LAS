import { z } from "zod";

import { MAX_FILE_SIZE } from "@/lib/constants";

// import type { Person } from "@/lib/data/persons";
export const SexTypeSchema = z.enum(["M", "F", "I"]);
export const NatureOfBirthSchema = z.enum(["LiveBirth", "StillBirth"]);
export const validationStatusSchema = z
  .enum(["alert", "success", "pending", "rejected"])
  .optional();

export const personContactSchema = z.object({
  phoneCode: z.string().trim().nonempty(),
  phone: z.string().trim().nonempty(),
  email: z.string().email().optional(),
});

const basePersonSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  sex: SexTypeSchema,
  natureOfBirth: NatureOfBirthSchema,
  dob: z.string(),
  validationStatus: validationStatusSchema,
  age: z.string().optional(),
  email: z.string().optional(),
  weightOnBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  citizenship: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  education: z.string().optional(),
  contacts: z.array(personContactSchema).min(1),
  healthInstitution: z.string().optional(),
  birthSublocation: z.string().optional(),
  birthSublocationDistrict: z.string().optional(),
  passportNumber: z.string().optional(),
  fathersName: z.string().optional(),
  informantType: z.string().optional(),
});

export type Person = z.infer<typeof basePersonSchema> & {
  father?: string | null | undefined;
  mother?: string | null | undefined;
  siblings?: Person[];
  children?: Person[];
  spouse?: Person;
};

// Schema with recursive relations
export const personSchema: z.ZodType<Person> = basePersonSchema.extend({
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
  email: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  sex: SexTypeSchema.optional()
    .nullable()
    .transform((val) => val ?? undefined),
  natureOfBirth: NatureOfBirthSchema.optional()
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
  healthInstitution: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  residenceDistrict: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  residenceSublocation: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  passportNumber: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  fathersName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  informantType: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  affidavit: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  affidavitFile: z
    .instanceof(File)
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  contacts: z.array(personContactSchema).min(1),
});

export const fatherFormSchema = personFormSchema.extend({
  affidavitFile: z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size > 0, "File is required")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
});

export const childFormSchema = personFormSchema.extend({
  natureOfBirth: NatureOfBirthSchema,
  firstName: z.string().nonempty(),
  sex: SexTypeSchema,
  dob: z.string().nonempty(),
  weightOnBirth: z.string().nonempty(),
  healthInstitution: z.string().optional(),
  birthSublocation: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  birthSublocationDistrict: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  contacts: z
    .array(personContactSchema)
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});

export type PersonForm = z.infer<typeof personFormSchema>;
