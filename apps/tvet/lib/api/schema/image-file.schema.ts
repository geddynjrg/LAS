import { z } from "zod";

export const ImageSchema = z.object({
  id: z.string(),
  type: z.string(),
  bundle: z.string(),
  name: z.string(),
  uuid: z.string(),
  url: z.string(),
  mime_type: z.string(),
  size: z.number(),
  alt: z.string(),
  title: z.string(),
  width: z.string(),
  height: z.string(),
});

export type ImageType = z.infer<typeof ImageSchema>;

/**
 * Single image schema (drupal API returns [] for missing image instead of an object)
 */
export const SingleImageSchema = z
  .preprocess(
    (data) => (Array.isArray(data) && data.length > 0 ? data[0] : data),
    ImageSchema,
  )
  .optional();

export type SingleImageType = z.infer<typeof SingleImageSchema>;
