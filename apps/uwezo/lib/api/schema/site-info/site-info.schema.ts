import { z } from "zod";
import { SiteInformationDataSchema } from "./site-info-data.schema";
import { SiteInformationMetaSchema } from "./site-info-meta.schema";

export const SiteInformationResponseSchema = z.object({
  data: SiteInformationDataSchema,
  meta: SiteInformationMetaSchema,
});

export type SiteInformationResponse = z.infer<typeof SiteInformationResponseSchema>;

// Re-export the sub-schemas and types for convenience
export { SiteInformationDataSchema, type SiteInformationData } from "./site-info-data.schema";
export { SiteInformationMetaSchema, type SiteInformationMeta } from "./site-info-meta.schema";
export { UsefulLinkSchema, type UsefulLink } from "./useful-link.schema"; 