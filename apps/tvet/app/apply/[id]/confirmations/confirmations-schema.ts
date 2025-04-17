import { z } from "zod";

import { checkbox } from "@workspace/ui/lib/zod";

export const confirmationsSchema = z.object({
  confirm_personal_information: checkbox(true),
  confirm_eligibility: checkbox(true),
});

export type ConfirmationsSchema = z.infer<typeof confirmationsSchema>;
