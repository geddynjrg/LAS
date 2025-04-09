import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import {
  GradientCornerCard,
  gradientCornerCardVariants,
} from "@workspace/ui/components/tvet/gradient-corner-card";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";
import { cn } from "@workspace/ui/lib/utils";

export interface TextBlockWithBackgroundBlockProps {
  className?: string;
  block_type: "text_block_with_background";
  items: {
    title?: string;
    description?: {
      value: string | null;
      format: string | null;
      processed: string | null;
    };
  }[];
}

export const TextBlockWithBackgroundBlock: FC<
  TextBlockWithBackgroundBlockProps
> = ({ items, className }) => {
  return (
    <section className={cn("bg-neutral-100", className)}>
      <Container className="flex flex-col gap-6 max-lg:px-0 lg:py-8">
        {items.map(({ title, description }, index) => (
          <RoundedCornerSection key={index}>
            <RoundedCornerSectionHeader asChild variant="rounded">
              <GradientCornerCard
                color={
                  (index &&
                    gradientCornerCardVariants.variants.color[index % 2]) ||
                  "blue"
                }
                gradient={
                  index
                    ? gradientCornerCardVariants.variants.gradient[index % 2]
                    : undefined
                }
              >
                <Heading
                  type="h2"
                  className="text-primary-foreground typo-h1-sm bottom-8 m-4 self-end"
                >
                  {title}
                </Heading>
              </GradientCornerCard>
            </RoundedCornerSectionHeader>
            <RoundedCornerCard>
              <DescriptionBlock {...description} />
            </RoundedCornerCard>
          </RoundedCornerSection>
        ))}
      </Container>
    </section>
  );
};
