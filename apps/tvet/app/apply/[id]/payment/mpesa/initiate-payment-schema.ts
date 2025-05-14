import { z } from "zod";

export const initiatePaymentSchema = z.object({
  id: z.string().trim().nonempty(),
  callingCode: z.string().trim().nonempty(),
  phone: z.string().trim().nonempty(),
});

export type InitiatePaymentSchema = z.infer<typeof initiatePaymentSchema>;
