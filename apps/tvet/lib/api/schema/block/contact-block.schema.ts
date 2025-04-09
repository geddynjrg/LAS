import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";

export const ContactBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("contact"),

  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  apply_button: z.boolean().nullable().optional(),
});

export type ContactBlockType = z.infer<typeof ContactBlockSchema>;
