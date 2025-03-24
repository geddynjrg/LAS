import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { GalleryCarousel } from "@workspace/ui/components/gallery-carousel";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
} from "@workspace/ui/components/tvet/rounded-corner-section";

export interface GalleryBlockProps {
  block_type: "gallery";
  title: string;
  description: {
    value: string;
    format: string;
    processed: string;
  };
  images: {
    title: string;
    type: string;
    id: string;
    uuid: string;
    name: string;
    url: string;
    bundle: string;
    mime_type: string;
    size: number;
    alt: string;
    width: string;
    height: string;
  }[];
}

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
