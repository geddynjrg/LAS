import type { FC } from "react";

import { ApplicationBlock } from "@workspace/ui/components/tvet/blocks/application-block";
import { AvailableSponsorshipsBlock } from "@workspace/ui/components/tvet/blocks/available-sponsorships-block";
import { CourseDataBlock } from "@workspace/ui/components/tvet/blocks/course-data-block";
import { CoursesBlock } from "@workspace/ui/components/tvet/blocks/courses-block";
import { FeatureSectionBlock } from "@workspace/ui/components/tvet/blocks/feature-section-block";
import { GalleryBlock } from "@workspace/ui/components/tvet/blocks/gallery-block";
import { LocationBlock } from "@workspace/ui/components/tvet/blocks/location-block";
import { MediaBlock } from "@workspace/ui/components/tvet/blocks/media-image-block";
import { SectionHeaderBlock } from "@workspace/ui/components/tvet/blocks/section-header-block";
import { SimilarCoursesBlock } from "@workspace/ui/components/tvet/blocks/similar-courses-block";
import { SocialBlock } from "@workspace/ui/components/tvet/blocks/social-block";
import { TestimonialsBlock } from "@workspace/ui/components/tvet/blocks/testimonials-block";
import { TextBlock } from "@workspace/ui/components/tvet/blocks/text-block";
import { TextListBlock } from "@workspace/ui/components/tvet/blocks/text-list-block";
import { TrainingAreasBlock } from "@workspace/ui/components/tvet/blocks/training-areas-block";
import { VocationalCentersBlock } from "@workspace/ui/components/tvet/blocks/vocational-centers-block";

import { HighlightedCourseListingBlock } from "@/components/page-blocks/highlighted-course-listing-block";
import { TextBlockWithBackgroundBlock } from "@/components/page-blocks/text-block-with-background-block";
import { TextWithGradientBlock } from "@/components/page-blocks/text-with-gradient-block";
import type { BlockType } from "@/lib/api/types";

export interface PageComponentsProps {
  applicationBlockId?: string;
  page_components?: BlockType[];
}

export const PageComponents: FC<PageComponentsProps> = ({
  applicationBlockId,
  page_components = [],
}) => {
  return page_components.map((component, index) => {
    const key = component.block_type + index;

    switch (component.block_type) {
      case "application":
        return <ApplicationBlock {...component} key={key} />;

      case "section_heading":
        return <SectionHeaderBlock {...component} key={key} />;

      case "feature_section":
        return <FeatureSectionBlock {...component} key={key} />;

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
        return <AvailableSponsorshipsBlock {...component} key={key} />;

      case "similar_courses":
        return <SimilarCoursesBlock {...component} key={key} />;

      default:
        return <p> unknown {(component as any)?.block_type}</p>;
    }
  });
};
