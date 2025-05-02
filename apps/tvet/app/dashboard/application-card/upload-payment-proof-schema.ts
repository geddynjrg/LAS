import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".jpeg", ".png"],
  "application/pdf": [".pdf"],
};

export const uploadPaymentProofSchema = z.object({
  id: z.string().trim().nonempty(),
  payment_proof: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
});

export type UploadPaymentProofSchema = z.infer<typeof uploadPaymentProofSchema>;
