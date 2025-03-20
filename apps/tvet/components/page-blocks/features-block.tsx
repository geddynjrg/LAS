import { IconTimeline, IconTools, IconZoomMoney } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { FeatureSection } from "@workspace/ui/components/tvet/feature-section";

import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { FeaturesBlockType } from "@/lib/api/schema/block/features-block.schema";

export interface FeaturesBlockProps extends FeaturesBlockType {}

export const FeaturesBlock: FC<FeaturesBlockProps> = ({
  features,
  description,
}) => {
  return (
    <FeatureSection
      className="bg-background lg:mt-8"
      features={
        features
          ? features.map((item, index) => ({
              title: item.feature,
              text: item.short_description.value,
              icon: <FeatureIcon index={index} />,
            }))
          : []
      }
    >
      <DescriptionBlock {...description} />
    </FeatureSection>
  );
};

const FeatureIcon: FC<{ index: number }> = ({ index }) => {
  switch (index) {
    case 0:
      return <IconTools key={index} />;
    case 1:
      return <IconTimeline key={index} />;
    case 2:
      return <IconZoomMoney key={index} />;

    default:
      return null;
  }
};
