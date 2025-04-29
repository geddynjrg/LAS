import { z } from "zod";

import { checkbox } from "@workspace/ui/lib/zod";

export const confirmationSchema = z.object({
  confirm_personal_information: checkbox(true),
  confirm_eligibility: checkbox(true),
});

export type ConfirmationSchema = z.infer<typeof confirmationSchema>;
