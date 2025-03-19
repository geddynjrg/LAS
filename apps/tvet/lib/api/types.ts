import { z } from "zod";

const ApiResponseSchema = z.union([
  z.object({
    data: z.any(),
    meta: z.any(),
  }),
  z.object({
    error: z.object({
      message: z.string(),
    }),
  }),
]);

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

export const TextBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block"),
  title: z.string(),
  description: DescriptionSchema,
});

export type TextBlockType = z.infer<typeof TextBlockSchema>;

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

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  application_fee: z.number().nullable(),
  course_fee: z.number().nullable(),
  apply_till: z.array(z.string()),
  start_on: z.array(z.string()),
  institution: z.preprocess(
    (data) => (Array.isArray(data) ? data[0] : data),
    z.object({
      id: z.string(),
      type: z.string(),
      uuid: z.string(),
      title: z.string(),
      path_alias: z.string(),
    }),
  ),
  url: z.string(),
  path_alias: z.string(),
});

export const HighlightedCourseListingBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("highlighted_course_listing"),

  courses: z.array(CourseSchema),
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

export const MediaBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("media"),

  media: z.array(ImageSchema),
});

export type MediaBlockBlockType = z.infer<typeof MediaBlockSchema>;

export const CoursesBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("courses"),

  title: z.string(),
  short_description: DescriptionSchema,
  courses: z.array(CourseSchema),
});

export type CoursesBlockType = z.infer<typeof CoursesBlockSchema>;

export const GalleryBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("gallery"),

  title: z.string(),
  description: DescriptionSchema,
  images: z.array(ImageSchema),
});

export type GalleryBlockType = z.infer<typeof GalleryBlockSchema>;

export const TextBlockWithGradientBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_gradient"),

  block_text: z.array(DescriptionSchema),
});

export type TextBlockWithGradientBlockType = z.infer<
  typeof TextBlockWithGradientBlockSchema
>;

export const LocationBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("location"),

  hint: z.string(),
  image: z.array(ImageSchema),
  show_map: z.boolean(),
  show_directions: z.boolean(),
});

export type LocationBlockType = z.infer<typeof LocationBlockSchema>;

export const SocialBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("social_block"),

  social_links: z.array(
    z.object({
      platform: z.string(),
      url: z.string(),
      account: z.string(),
      icon: z.string(),
    }),
  ),
});

export type SocialBlockType = z.infer<typeof SocialBlockSchema>;

export const CourseDataBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("course_data"),

  description: DescriptionSchema,
});

export type CourseDataBlockType = z.infer<typeof CourseDataBlockSchema>;

export const TextListBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_list"),

  title: z.string(),
  short_description: DescriptionSchema,
  type: z.string(),
  items: z.array(z.string()),
});

export type TextListBlockType = z.infer<typeof TextListBlockSchema>;

export const TestimonialsBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("testimonials"),

  testimonials: z.array(
    z.object({
      block_type: z.literal("testimonial"),
      name: z.string(),
      short_description: DescriptionSchema,
      image: z.array(ImageSchema),
    }),
  ),
});

export type TestimonialsBlockType = z.infer<typeof TestimonialsBlockSchema>;

export const FileSchema = z.object({
  id: z.string(),
  type: z.string(),
  bundle: z.string(),
  name: z.string(),
  uuid: z.string(),
  url: z.string(),
  mime_type: z.string(),
  size: z.number(),
});

export const SponsorshipSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: DescriptionSchema,
  application_form: FileSchema,
  link: z.array(LinkSchema),
});

export const AvailableSponsorshipsBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("available_sponsorships"),

  sponsorships: z.array(SponsorshipSchema),
});

export type AvailableSponsorshipsBlockType = z.infer<
  typeof AvailableSponsorshipsBlockSchema
>;

export const SimilarCoursesBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("similar_courses"),

  courses: z.array(CourseSchema),
});

export type SimilarCoursesBlockType = z.infer<typeof SimilarCoursesBlockSchema>;

export const BlockSchema = z.union([
  ApplicationBlockSchema,
  SectionHeadingBlockSchema,
  FeaturesBlockSchema,
  TextBlockSchema,
  VocationalCentresBlockSchema,
  HighlightedCourseListingBlockSchema,
  TrainingAreasBlockSchema,
  TextBlockWithBackgroundBlockSchema,
  MediaBlockSchema,
  CoursesBlockSchema,
  GalleryBlockSchema,
  TextBlockWithGradientBlockSchema,
  LocationBlockSchema,
  SocialBlockSchema,
  CourseDataBlockSchema,
  TextListBlockSchema,
  TestimonialsBlockSchema,
  AvailableSponsorshipsBlockSchema,
  SimilarCoursesBlockSchema,
]);

export type BlockType = z.infer<typeof BlockSchema>;
