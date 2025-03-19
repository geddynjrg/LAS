import type { FC, ReactNode } from "react";

import { ApplicationBlock } from "@/components/page-blocks/application-block";
import { AvailableSponsorships } from "@/components/page-blocks/available-sponsorships";
import { CourseDataBlock } from "@/components/page-blocks/course-data-block";
import { CoursesBlock } from "@/components/page-blocks/courses-block";
import { FeaturesBlock } from "@/components/page-blocks/features-block";
import { GalleryBlock } from "@/components/page-blocks/gallery-block";
import { HighlightedCourseListingBlock } from "@/components/page-blocks/highlighted-course-listing-block";
import { LocationBlock } from "@/components/page-blocks/location-block";
import { MediaBlock } from "@/components/page-blocks/media-image-block";
import { SectionHeaderBlock } from "@/components/page-blocks/section-header-block";
import { SimilarCoursesBlock } from "@/components/page-blocks/similar-courses-block";
import { SocialBlock } from "@/components/page-blocks/social-block";
import { TestimonialsBlock } from "@/components/page-blocks/testimonials-block";
import { TextBlock } from "@/components/page-blocks/text-block";
import { TextBlockWithBackgroundBlock } from "@/components/page-blocks/text-block-with-background-block";
import { TextListBlock } from "@/components/page-blocks/text-list-block";
import { TextWithGradientBlock } from "@/components/page-blocks/text-with-gradient-block";
import { TrainingAreasBlock } from "@/components/page-blocks/training-areas-block";
import { VocationalCentersBlock } from "@/components/page-blocks/vocational-centers-block";
import type { BlockType } from "@/lib/api/types";

export interface PageComponentsProps {
  page_components: BlockType[];
}

export const PageComponents: FC<PageComponentsProps> = ({
  page_components,
}) => {
  if (!page_components) {
    return <p>No content</p>;
  }

  return page_components.map((component, index) => {
    const key = component.block_type + index;

    switch (component.block_type) {
      case "application":
        return <ApplicationBlock {...component} key={key} />;

      case "section_heading":
        return <SectionHeaderBlock {...component} key={key} />;

      case "feature_section":
        return <FeaturesBlock {...component} key={key} />;

      case "vocational_centres":
        return <VocationalCentersBlock {...component} key={key} />;

      case "text_block":
        return <TextBlock {...component} key={key} />;

      case "highlighted_course_listing":
        return <HighlightedCourseListingBlock {...component} key={key} />;

      case "training_areas":
        return <TrainingAreasBlock {...component} key={key} />;

      case "text_block_with_background":
        return <TextBlockWithBackgroundBlock {...component} key={key} />;

      case "media":
        return <MediaBlock {...component} key={key} />;

      case "courses":
        return <CoursesBlock {...component} key={key} />;

      case "gallery":
        return <GalleryBlock {...component} key={key} />;

      case "text_block_with_gradient":
        return <TextWithGradientBlock {...component} key={key} />;

      case "location":
        return <LocationBlock {...component} key={key} />;

      case "social_block":
        return <SocialBlock {...component} key={key} />;

      case "course_data":
        return <CourseDataBlock {...component} key={key} />;

      case "text_list":
        return <TextListBlock {...component} key={key} />;

      case "testimonials":
        return <TestimonialsBlock {...component} key={key} />;

      case "available_sponsorships":
        return <AvailableSponsorships {...component} key={key} />;

      case "similar_courses":
        return <SimilarCoursesBlock {...component} key={key} />;

      default:
        return <p> unknown {(component as any)?.block_type}</p>;
    }
  });
};
