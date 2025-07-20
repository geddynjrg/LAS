import { z } from "zod";
import { UsefulLinkSchema } from "./useful-link.schema";

export const SiteInformationDataSchema = z.object({
  site: z.object({
    name: z.string(),
    slogan: z.string(),
    mail: z.string().email(),
    contact: z.object({
      address: z.string(),
      po_box: z.string(),
      phone: z.string(),
      email: z.string().email(),
    }),
  }),
  useful_links: z.array(UsefulLinkSchema),
});

export type SiteInformationData = z.infer<typeof SiteInformationDataSchema>; 