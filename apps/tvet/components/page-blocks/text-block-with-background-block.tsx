import { IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";

import { GradientCornerCard } from "@/components/gradient-corner-card";
import type { TextBlockWithBackgroundBlockType } from "@/lib/api/schema/block/text-block-with-background-block.schema";

export interface TextBlockWithBackgroundBlockProps
  extends TextBlockWithBackgroundBlockType {}

export const TextBlockWithBackgroundBlock: FC<
  TextBlockWithBackgroundBlockProps
> = ({ title, link, block_text, button_type }) => {
  return (
    <section className="bg-neutral-100">
      <Container className="max-lg:px-0 lg:py-8">
        <RoundedCornerSection>
          <RoundedCornerSectionHeader asChild variant="rounded">
            <GradientCornerCard color="blue" gradient="blend1">
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
