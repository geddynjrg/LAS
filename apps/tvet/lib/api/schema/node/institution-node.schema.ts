import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";
import { BlockSchema } from "@/lib/api/types";

export const InstitutionNodeSchema = z.object({
  data: z.object({
    id: z.string(),
    type: z.literal("institution"),
    uuid: z.string(),
    title: z.string(),
    language: z.object({
      code: z.string(),
      name: z.string(),
      direction: z.string(),
    }),
    url: z.string(),
    path_alias: z.string(),
    content: z.object({
      address: z.object({
        country_code: z.string(),
        administrative_area: z.null(),
        locality: z.string(),
        dependent_locality: z.null(),
        postal_code: z.string(),
        address_line: z.string(),
        organization: z.null(),
      }),
      body: z.object({
        value: z.string(),
        format: z.string(),
        processed: z.string(),
      }),
      contact_text: z.object({
        value: z.string(),
        format: z.string(),
        processed: z.string(),
      }),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      image: ImageSchema,
      page_components: z.array(BlockSchema),
    }),
  }),
  meta: z.object({
    timestamp: z.number(),
    version: z.string(),
    language: z.object({
      current: z.string(),
      default: z.string(),
      available: z.record(
        z.string(),
        z.object({
          langcode: z.string(),
          name: z.string(),
          url: z.string(),
          path: z.string(),
        }),
      ),
    }),
  }),
});

export type InstitutionNodeType = z.infer<typeof InstitutionNodeSchema>;
