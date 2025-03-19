import { IconChecklist } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";

import { GradientCornerCard } from "@/components/gradient-corner-card";
import { Heading } from "@/components/heading";
import type { TextBlockWithBackgroundBlockType } from "@/lib/api/types";

export interface TextBlockWithBackgroundBlockProps
  extends TextBlockWithBackgroundBlockType {}

export const TextBlockWithBackgroundBlock: FC<
  TextBlockWithBackgroundBlockProps
> = ({ title, link, button_type }) => {
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
            <h3 className="font-bold">Looking for a path to success?</h3>
            <p>
              TVET (Technical and Vocational Education and Training) gives you
              the skills you need to build a career and take control of your
              future. Whether you want to become an electrician, chef,
              hairdresser, or entrepreneur, TVET equips you with hands-on
              training that prepares you for real jobs.
            </p>
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
