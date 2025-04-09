import type { FC } from "react";

import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import {
  GradientCornerCard,
  gradientCornerCardVariants,
} from "@workspace/ui/components/tvet/gradient-corner-card";
import { cn } from "@workspace/ui/lib/utils";

export interface TextWithGradientBlockProps {
  className?: string;
  block_type: "text_block_with_gradient";
  block_text: {
    value: string | null;
    format: string | null;
    processed: string | null;
  }[];
}

export const TextWithGradientBlock: FC<TextWithGradientBlockProps> = ({
  block_text,
  className,
}) => {
  return (
    <section
      className={cn(
        "bg-background grid grid-cols-1 gap-4 px-4 pb-12 pt-8",
        className,
      )}
    >
      <div className="app-container grid grid-cols-1 gap-4 lg:grid-cols-3">
        {block_text.map((description, index) => (
          <GradientCornerCard
            key={index}
            color={
              gradientCornerCardVariants.variants.color[index % 2] || "blue"
            }
            gradient={gradientCornerCardVariants.variants.gradient[index % 2]}
          >
            <DescriptionBlock {...description} />
          </GradientCornerCard>
        ))}
      </div>
    </section>
  );
};
