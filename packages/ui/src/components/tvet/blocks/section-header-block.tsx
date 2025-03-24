import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { SectionHeader } from "@workspace/ui/components/tvet/section-header";

export interface SectionHeaderBlockProps {
  block_type: "section_heading";
  title: string;
  description: {
    value: string;
    format: string;
    processed: string;
  };
  image: {
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

export const SectionHeaderBlock: FC<SectionHeaderBlockProps> = ({
  title,
  description,
  image,
}) => {
  const headerImage = image.reduce((prev, img) => img || prev);
  return (
    <Container className="px-0">
      <SectionHeader
        title={title}
        image={{
          url: headerImage.url,
          alt: headerImage.alt,
        }}
        // subtitle="Looking for a path to success?"
      >
        <DescriptionBlock {...description} />
      </SectionHeader>
    </Container>
  );
};
