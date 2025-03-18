import { z } from "zod";

const guardianRole = z.enum(["parent", "grandparent", "relative", "other"]);
const idType = z.enum(["national-id", "birth-certificate", "alien-id"]);

export const guardianSchema = z.object({
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  surname: z.string().min(1),
  guardianRole: guardianRole,
  idType: idType,
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
  secondaryCallingCode: z.string().optional(),
  secondaryPhone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]),

  // guardianRole === "parent"
  parentNationalId: z.string().optional(),

  // guardianRole === "grandparent"
  grandparentBirthCertificateNumber: z.string().optional(),
  grandparentBirthCertificateFile: z.instanceof(File).optional(),

  // guardianRole === "relative"
  relativeAlienId: z.string().optional(),
  relativeAlienIdIsRefugee: z.union([z.literal("on"), z.undefined()]),

  // idType === "national-id"
  nationalId: z.string().optional(),

  // idType === "birth-certificate"
  birthCertificateNumber: z.string().optional(),
  birthCertificateFile: z.instanceof(File).optional(),

  // idType === "alien-id"
  alienId: z.string().optional(),
  alienIdIsRefugee: z.union([z.literal("on"), z.undefined()]),

  // personWithDisabilities === "on"
  natureOfDisability: z.string().optional(),
  disabilityCardNumber: z.string().optional(),
  disabilityCardPicture: z.instanceof(File).optional(),
  disabilityLevel: z.string().optional(),
  disabilityDescription: z.string().optional(),
});

export type GuardianSchema = z.infer<typeof guardianSchema>;

export const guardianRoles = [
  { label: "Parent", value: "parent" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Relative", value: "relative" },
  { label: "Other", value: "other" },
];
