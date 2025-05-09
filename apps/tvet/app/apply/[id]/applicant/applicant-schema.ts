import { z } from "zod";

import { checkbox, validFile } from "@workspace/ui/lib/zod";

import {
  idTypeSChema,
  validateApplicantIdType,
} from "@/app/apply/[id]/id-type-schema";

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".jpeg", ".png"],
  "application/pdf": [".pdf"],
};
export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const sex = z.enum(["male", "female", "intersex"]);

export const disabilityNature = z.enum([
  "visual",
  "hearing",
  "physical",
  "cognitive",
  "multiple",
  "mental",
  "speech",
  "other",
]);

export const disabilityLevel = z.enum([
  "mild",
  "moderate",
  "severe",
  "profound",
]);

const phone = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
});

export const applicantSchema = idTypeSChema
  .extend({
    applicant_first_name: z.string().min(1),
    applicant_middle_name: z.string().optional(),
    applicant_surname: z.string().min(1),
    applicant_sex: sex,
    applicant_date_of_birth: z.string().trim().date(),
    applicant_email: z.string().email(),
    applicant_county: z.string().trim().nonempty(),
    applicant_subcounty: z.string().trim().nonempty(),
    applicant_ward: z.string().trim().nonempty(),
    phones: z.array(phone),
    applicant_disability: checkbox(),

    // applicant_disability === true
    disability_nature: disabilityNature.optional(),
    disability_card_number: z.string().optional(),
    disability_card_picture: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
    disability_level: disabilityLevel.optional(),
    disability_requirements: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    validateApplicantIdType(data, ctx);
    validateApplicantDisabilities(data, ctx);
  });

export type ApplicantSchema = z.infer<typeof applicantSchema>;

function validateApplicantDisabilities(
  data: ApplicantSchema,
  ctx: z.RefinementCtx,
) {
  if (!data.applicant_disability) {
    return;
  }

  if ((data.disability_card_number?.trim()?.length ?? 0) < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: "string",
      minimum: 1,
      inclusive: true,
      path: ["disability_card_number"],
    });
  }

  if (!data.disability_card_picture) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: "string",
      minimum: 1,
      inclusive: true,
      path: ["disability_card_picture"],
    });
  }
}
