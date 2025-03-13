import { z } from "zod";

export const AbstractBlockSchema = z.object({
  block_type: z.string(),
  title: z.string(),
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
  description: DescriptionSchema,
  checkpoints: z.array(z.string()),
});

export type ApplicationBlockType = z.infer<typeof ApplicationBlockSchema>;

export const SectionHeadingBlockType = AbstractBlockSchema.extend({
  block_type: z.literal("section_heading"),

  description: DescriptionSchema,
  image: z.array(ImageSchema),
});
export const FeatureBlockType = AbstractBlockSchema.extend({
  block_type: z.literal("feature"),
  feature: z.string(),
  short_description: DescriptionSchema,
});

export const FeaturesBlockType = AbstractBlockSchema.extend({
  block_type: z.literal("feature_section"),
  description: DescriptionSchema,
  features: z.array(FeatureBlockType),
});

export const BlockSchema = z.union([
  ApplicationBlockSchema,
  SectionHeadingBlockType,
  //   z.object({
  //     block_type: z.string(),
  //     description: z.object({
  //       value: z.string(),
  //       format: z.string(),
  //       processed: z.string(),
  //     }),
  //   }),
  //   z.object({
  //     block_type: z.string(),
  //     description: z.object({
  //       value: z.string(),
  //       format: z.string(),
  //       processed: z.string(),
  //     }),
  //   }),
  //   z.object({
  //     block_type: z.string(),
  //     institutions: z.array(
  //       z.object({
  //         id: z.string(),
  //         title: z.string(),
  //         address: z.object({
  //           country_code: z.string(),
  //           administrative_area: z.null(),
  //           locality: z.string(),
  //           dependent_locality: z.null(),
  //           postal_code: z.string(),
  //           address_line: z.string(),
  //           organization: z.null(),
  //         }),
  //         location: z.object({
  //           latitude: z.number(),
  //           longitude: z.number(),
  //         }),
  //         url: z.string(),
  //         path_alias: z.string(),
  //       }),
  //     ),
  //   }),
  //   z.object({
  //     block_type: z.string(),
  //     courses: z.array(
  //       z.union([
  //         z.object({
  //           id: z.string(),
  //           title: z.string(),
  //           tags: z.array(z.string()),
  //           application_fee: z.number(),
  //           course_fee: z.number(),
  //           apply_till: z.array(z.unknown()),
  //           start_on: z.array(z.unknown()),
  //           institution: z.object({
  //             id: z.string(),
  //             type: z.string(),
  //             uuid: z.string(),
  //             title: z.string(),
  //             path_alias: z.string(),
  //           }),
  //           url: z.string(),
  //           path_alias: z.string(),
  //         }),
  //         z.object({
  //           id: z.string(),
  //           title: z.string(),
  //           tags: z.array(z.string()),
  //           application_fee: z.null(),
  //           course_fee: z.null(),
  //           apply_till: z.array(z.unknown()),
  //           start_on: z.array(z.unknown()),
  //           institution: z.object({
  //             id: z.string(),
  //             type: z.string(),
  //             uuid: z.string(),
  //             title: z.string(),
  //             path_alias: z.string(),
  //           }),
  //           url: z.string(),
  //           path_alias: z.string(),
  //         }),
  //         z.object({
  //           id: z.string(),
  //           title: z.string(),
  //           tags: z.array(z.unknown()),
  //           application_fee: z.null(),
  //           course_fee: z.null(),
  //           apply_till: z.array(z.unknown()),
  //           start_on: z.array(z.unknown()),
  //           institution: z.array(z.unknown()),
  //           url: z.string(),
  //           path_alias: z.string(),
  //         }),
  //       ]),
  //     ),
  //   }),
  //   z.object({
  //     block_type: z.string(),
  //     areas: z.array(
  //       z.object({
  //         id: z.string(),
  //         name: z.string(),
  //         course_count: z.number(),
  //       }),
  //     ),
  //   }),
  //   z.object({
  //     block_type: z.string(),
  //     title: z.string(),
  //     link: z.array(
  //       z.object({
  //         title: z.string(),
  //         url: z.string(),
  //         options: z.array(z.unknown()),
  //         is_external: z.boolean(),
  //       }),
  //     ),
  //     button_type: z.string(),
  //   }),
]);

export type BlockType = z.infer<typeof BlockSchema>;
