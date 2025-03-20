import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { FileSchema } from "@/lib/api/schema/file.schema";
import { LinkSchema } from "@/lib/api/schema/link.schema";

export const SponsorshipSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: DescriptionSchema,
  application_form: FileSchema,
  link: z.array(LinkSchema),
});
