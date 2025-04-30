import { z } from "zod";

import { checkbox, validFile } from "@workspace/ui/lib/zod";

export const idType = z.enum(["national_id", "birth_certificate", "alien_id"]);
export type IdType = z.infer<typeof idType>;

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".png"],
  "application/pdf": [".pdf"],
};
export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const idTypeSChema = z.object({
  id_type: idType,

  // idType === "national_id"
  id_number: z.string().trim().optional(),

  // idType === "birth_certificate"
  birth_certificate_number: z.string().optional(),
  birth_certificate_file: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),

  // idType === "alien_id"
  alien_id_number: z.string().optional(),
  is_refugee: checkbox(),
});

export type IdTypeSchema = z.infer<typeof idTypeSChema>;

export function validateApplicantIdType(
  data: IdTypeSchema,
  ctx: z.RefinementCtx,
) {
  switch (data.id_type) {
    case "national_id": {
      if ((data.id_number?.trim()?.length ?? 0) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          type: "string",
          minimum: 1,
          inclusive: true,
          path: ["id_number"],
        });
      }

      break;
    }

    case "birth_certificate": {
      if ((data.birth_certificate_number?.trim()?.length ?? 0) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          type: "string",
          minimum: 1,
          inclusive: true,
          path: ["birth_certificate_number"],
        });
      }

      if (!data.birth_certificate_file) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          type: "string",
          minimum: 1,
          inclusive: true,
          path: ["birth_certificate_file"],
        });
      }

      break;
    }

    case "alien_id": {
      if ((data.alien_id_number?.trim()?.length ?? 0) < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          type: "string",
          minimum: 1,
          inclusive: true,
          path: ["alien_id_number"],
        });
      }

      break;
    }
  }
}
