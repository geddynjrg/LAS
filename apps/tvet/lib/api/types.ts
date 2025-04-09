import { z } from "zod";

import { ApplicationBlockSchema } from "@/lib/api/schema/block/application-block.schema";
import { AvailableSponsorshipsBlockSchema } from "@/lib/api/schema/block/available-sponsorships-block.schema";
import { ContactBlockSchema } from "@/lib/api/schema/block/contact-block.schema";
import { CoursesBlockSchema } from "@/lib/api/schema/block/course-block.schema";
import { CourseDataBlockSchema } from "@/lib/api/schema/block/course-data-block.schema";
import { FeaturesBlockSchema } from "@/lib/api/schema/block/features-block.schema";
import { GalleryBlockSchema } from "@/lib/api/schema/block/gallery-block.schema";
import { HighlightedCourseListingBlockSchema } from "@/lib/api/schema/block/highlighted-course-listing-block.schema";
import { LocationBlockSchema } from "@/lib/api/schema/block/location-block.schema";
import { MediaBlockSchema } from "@/lib/api/schema/block/media-block.schema";
import { SectionHeadingBlockSchema } from "@/lib/api/schema/block/section-heading-block.schema";
import { SimilarCoursesBlockSchema } from "@/lib/api/schema/block/similar-courses-block.schema";
import { SocialBlockSchema } from "@/lib/api/schema/block/social-block.schema";
import { TestimonialsBlockSchema } from "@/lib/api/schema/block/testimonials-block.schema";
import { TextBlockWithBackgroundBlockSchema } from "@/lib/api/schema/block/text-block-with-background-block.schema";
import { TextBlockWithGradientBlockSchema } from "@/lib/api/schema/block/text-block-with-gradient.schema";
import { TextBlockSchema } from "@/lib/api/schema/block/text-block.schema";
import { TextListBlockSchema } from "@/lib/api/schema/block/text-list-block.schema";
import { TrainingAreasBlockSchema } from "@/lib/api/schema/block/training-areas-block.schema";
import { VocationalCentresBlockSchema } from "@/lib/api/schema/block/vocational-centres-block.schema";

export const BlockSchema = z.discriminatedUnion("block_type", [
  ApplicationBlockSchema,
  AvailableSponsorshipsBlockSchema,
  ContactBlockSchema,
  CourseDataBlockSchema,
  CoursesBlockSchema,
  FeaturesBlockSchema,
  GalleryBlockSchema,
  HighlightedCourseListingBlockSchema,
  MediaBlockSchema,
  LocationBlockSchema,
  VocationalCentresBlockSchema,
  SectionHeadingBlockSchema,
  SimilarCoursesBlockSchema,
  SocialBlockSchema,
  TextBlockWithBackgroundBlockSchema,
  TextBlockWithGradientBlockSchema,
  TextListBlockSchema,
  TestimonialsBlockSchema,
  TextBlockSchema,
  TrainingAreasBlockSchema,
]);

export type BlockType = z.infer<typeof BlockSchema>;
