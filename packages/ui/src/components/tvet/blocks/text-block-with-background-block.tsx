import { IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
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
  index?: number;
  block_type: "text_block_with_background";
  title: string;
  block_text:
    | {
        value: string | null;
        format: string | null;
        processed: string | null;
      }
    | {
        value: string | null;
        format: string | null;
        processed: string | null;
      }[];
  link?:
    | {
        options: unknown[];
        title: string;
        url: string;
        is_external?: boolean | undefined;
      }[]
    | undefined;
  button_type?: string | undefined;
}

export const TextBlockWithBackgroundBlock: FC<
  TextBlockWithBackgroundBlockProps
> = ({ title, link, block_text, button_type, className, index }) => {
  return (
    <section className={cn("bg-neutral-100", className)}>
      <Container className="max-lg:px-0 lg:py-8">
        <RoundedCornerSection>
          <RoundedCornerSectionHeader asChild variant="rounded">
            <GradientCornerCard
              color={
                (index &&
                  gradientCornerCardVariants.variants.color[(index + 1) % 3]) ||
                "blue"
              }
              gradient={
                index
                  ? gradientCornerCardVariants.variants.gradient[index % 3]
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
            {Array.isArray(block_text) ? (
              block_text.map((block, id) => (
                <DescriptionBlock key={id} {...block} />
              ))
            ) : (
              <DescriptionBlock {...block_text} />
            )}
            {button_type == "apply_now" && link ? (
              <Button className="max-w-3xs w-full" asChild>
                <Link href={link[0]?.url ?? "#"}>
                  {link[0]?.title} <IconChecklist />
                </Link>
              </Button>
            ) : null}
          </RoundedCornerCard>
        </RoundedCornerSection>
      </Container>
    </section>
  );
};
