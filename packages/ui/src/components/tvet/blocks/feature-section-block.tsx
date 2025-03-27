import { IconTimeline, IconTools, IconZoomMoney } from "@tabler/icons-react";
import type { FC } from "react";

import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { FeatureSection } from "@workspace/ui/components/tvet/feature-section";

export interface FeaturesBlockProps {
  className?: string;
  block_type: "feature_section";
  description: {
    value: string | null;
    format: string | null;
    processed: string | null;
  };
  features:
    | {
        block_type: "feature";
        feature: string;
        short_description: {
          value: string | null;
          format: string | null;
          processed: string | null;
        };
      }[]
    | null;
}

export const FeatureSectionBlock: FC<FeaturesBlockProps> = ({
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
