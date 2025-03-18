import { z } from "zod";

export const applicantSchema = z.object({
  firstName: z.string().nonempty(),
  middleName: z.string().nonempty(),
  surname: z.string().min(1),
  radioGroup: z.string().nonempty(),
});

export type ApplicantSchema = z.infer<typeof applicantSchema>;
