import { z } from "zod";

import { FrontTextBlock } from "@/components/front-text-block";

export const AbstractBlockSchema = z.object({
  block_type: z.string(),
});

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

export const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
});

export type DescriptionType = z.infer<typeof DescriptionSchema>;

export const ApplicationBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("application"),

  title: z.string(),
  description: DescriptionSchema,
  checkpoints: z.array(z.string()),
});

export type ApplicationBlockType = z.infer<typeof ApplicationBlockSchema>;

export const SectionHeadingBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("section_heading"),

  title: z.string(),
  description: DescriptionSchema,
  image: z.array(ImageSchema),
});

export type SectionHeadingBlockType = z.infer<typeof SectionHeadingBlockSchema>;

export const FeatureSchema = AbstractBlockSchema.extend({
  block_type: z.literal("feature"),

  feature: z.string(),
  short_description: DescriptionSchema,
});

export const FeaturesBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("feature_section"),

  description: DescriptionSchema,
  features: z.array(FeatureSchema).nullable(),
});

export type FeaturesBlockType = z.infer<typeof FeaturesBlockSchema>;

export const FrontTextBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block"),
  title: z.string(),
  description: DescriptionSchema,
});

export type FrontTextBlockType = z.infer<typeof FrontTextBlockSchema>;

export const InstitutionSchema = z.object({
  id: z.string(),
  title: z.string(),
  address: z.object({
    country_code: z.string(),
    administrative_area: z.null(),
    locality: z.string(),
    dependent_locality: z.null(),
    postal_code: z.string(),
    address_line: z.string(),
    organization: z.null(),
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  url: z.string(),
  path_alias: z.string(),
});

export type InstituteType = z.infer<typeof InstitutionSchema>;

export const VocationalCentresBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("vocational_centres"),

  institutions: z.array(InstitutionSchema),
});

export type VocationalCentresBlockType = z.infer<
  typeof VocationalCentresBlockSchema
>;

export const HighlightedCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  application_fee: z.number().nullable(),
  course_fee: z.number().nullable(),
  apply_till: z.array(z.unknown()),
  start_on: z.array(z.unknown()),
  institution: z.union([
    z.object({
      id: z.string(),
      type: z.string(),
      uuid: z.string(),
      title: z.string(),
      path_alias: z.string(),
    }),
    z.array(z.unknown()),
  ]),

  url: z.string(),
  path_alias: z.string(),
});

export const HighlightedCourseListingBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("highlighted_course_listing"),

  courses: z.array(HighlightedCourseSchema),
});

export type HighlightedCourseListingBlockType = z.infer<
  typeof HighlightedCourseListingBlockSchema
>;

export const TrainingAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  course_count: z.number(),
});

export const TrainingAreasBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("training_areas"),

  areas: z.array(TrainingAreaSchema),
});

export type TrainingAreasBlockType = z.infer<typeof TrainingAreasBlockSchema>;

export const LinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  options: z.array(z.unknown()),
  is_external: z.boolean(),
});

export const TextBlockWithBackgroundBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_background"),
  title: z.string(),
  link: z.array(LinkSchema),
  button_type: z.string(),
});

export type TextBlockWithBackgroundBlockType = z.infer<
  typeof TextBlockWithBackgroundBlockSchema
>;

export const BlockSchema = z.union([
  ApplicationBlockSchema,
  SectionHeadingBlockSchema,
  FeaturesBlockSchema,
  FrontTextBlockSchema,
  VocationalCentresBlockSchema,
  HighlightedCourseListingBlockSchema,
  TrainingAreasBlockSchema,
  TextBlockWithBackgroundBlockSchema,
]);

export type BlockType = z.infer<typeof BlockSchema>;
