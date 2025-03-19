import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { GalleryCarousel } from "@workspace/ui/components/gallery-carousel";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { GalleryBlockType } from "@/lib/api/types";

export interface GalleryBlockProps extends GalleryBlockType {}

export const GalleryBlock: FC<GalleryBlockProps> = ({
  title,
  description,
  images,
}) => {
  return (
    <section className="bg-background pt-8">
      <Container className="max-lg:px-0">
        <Heading type="h2" className="mx-4">
          {title}
        </Heading>

        <RoundedCornerSection className="mt-4">
          <RoundedCornerSectionHeader className="!pb-0">
            <GalleryCarousel images={images} className="h-full w-full" />
          </RoundedCornerSectionHeader>

          <RoundedCornerCard>
            <DescriptionBlock {...description} />
          </RoundedCornerCard>
        </RoundedCornerSection>
      </Container>
    </section>
  );
};
