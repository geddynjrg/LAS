import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { SectionHeader } from "@workspace/ui/components/tvet/section-header";

import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { SectionHeadingBlockType } from "@/lib/api/types";

export interface SectionHeaderBlockProps extends SectionHeadingBlockType {}

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
