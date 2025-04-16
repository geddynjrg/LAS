import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

const guardianRole = z.enum(["parent", "grandparent", "relative", "other"]);
const idType = z.enum(["national-id", "birth-certificate", "alien-id"]);
const phone = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
});

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".png"],
  "application/pdf": [".pdf"],
};
export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const guardianSchema = z.object({
  guardian_first_name: z.string().trim().min(1),
  guardian_middle_name: z.string().trim().optional(),
  guardian_surname: z.string().trim().min(1),
  guardian_role: guardianRole,
  idType: idType,
  phones: z.array(phone),
  email: z.union([z.literal(""), z.string().email()]),

  // guardianRole === "parent"
  parentNationalId: z.string().optional(),

  // guardianRole === "grandparent"
  grandparentBirthCertificateNumber: z.string().optional(),
  grandparentBirthCertificateFile: validFile(
    FILE_ACCEPT,
    MAX_FILE_SIZE,
  ).optional(),

  // guardianRole === "relative"
  relativeAlienId: z.string().optional(),
  relativeAlienIdIsRefugee: z.union([z.literal("on"), z.undefined()]),

  // idType === "national-id"
  nationalId: z.string().optional(),

  // idType === "birth-certificate"
  birthCertificateNumber: z.string().optional(),
  birthCertificateFile: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),

  // idType === "alien-id"
  alienId: z.string().optional(),
  alienIdIsRefugee: z.union([z.literal("on"), z.undefined()]),

  // personWithDisabilities === "on"
  natureOfDisability: z.string().optional(),
  disabilityCardNumber: z.string().optional(),
  disabilityCardPicture: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
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
