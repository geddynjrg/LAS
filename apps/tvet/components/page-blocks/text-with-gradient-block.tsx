import type { FC } from "react";

import {
  GradientCornerCard,
  gradientCornerCardVariants,
} from "@/components/gradient-corner-card";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { TextBlockWithGradientBlockType } from "@/lib/api/types";

export interface TextWithGradientBlockProps
  extends TextBlockWithGradientBlockType {}

export const TextWithGradientBlock: FC<TextWithGradientBlockProps> = ({
  block_text,
}) => {
  return (
    <section className="bg-background grid grid-cols-1 gap-4 px-4 pb-12 pt-8">
      <div className="app-container grid grid-cols-1 gap-4 lg:grid-cols-3">
        {block_text.map((description, index) => (
          <GradientCornerCard
            key={index}
            color={
              gradientCornerCardVariants.variants.color[index % 3] || "blue"
            }
            gradient={gradientCornerCardVariants.variants.gradient[index % 3]}
          >
            <DescriptionBlock {...description} />
          </GradientCornerCard>
        ))}
      </div>
    </section>
  );
};
