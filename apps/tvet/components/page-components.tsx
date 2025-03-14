import type { FC, ReactNode } from "react";

import { ApplicationBlock } from "@/components/application-block";
import { FeaturesBlock } from "@/components/features-block";
import { FrontTextBlock } from "@/components/front-text-block";
import { HighlightedCourseListingBlock } from "@/components/highlighted-course-listing-block";
import { SectionHeaderBlock } from "@/components/section-header-block";
import { TextBlockWithBackgroundBlock } from "@/components/text-block-with-background-block";
import { TrainingAreasBlock } from "@/components/training-areas-block";
import { VocationalCentersBlock } from "@/components/vocational-centers-block";
import type { BlockType } from "@/lib/api/types";

export interface PageComponentsProps {
  components: BlockType[];
}

export const PageComponents: FC<PageComponentsProps> = ({ components }) => {
  return components.map((component) => {
    switch (component.block_type) {
      case "application":
        return <ApplicationBlock {...component} />;

      case "section_heading":
        return <SectionHeaderBlock {...component} />;

      case "feature_section":
        return <FeaturesBlock {...component} />;

      case "vocational_centres":
        return <VocationalCentersBlock {...component} />;

      case "text_block":
        return <FrontTextBlock {...component} />;

      case "highlighted_course_listing":
        return <HighlightedCourseListingBlock {...component} />;

      case "training_areas":
        return <TrainingAreasBlock {...component} />;

      case "text_block_with_background":
        return <TextBlockWithBackgroundBlock {...component} />;

      default:
        return <p> unknown {(component as any)?.block_type}</p>;
    }
  });
};
