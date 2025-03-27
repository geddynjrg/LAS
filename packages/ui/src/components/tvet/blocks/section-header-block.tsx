import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { SectionHeader } from "@workspace/ui/components/tvet/section-header";
import { cn } from "@workspace/ui/lib/utils";

export interface SectionHeaderBlockProps {
  className?: string;
  block_type: "section_heading";
  title: string;
  description: {
    value: string | null;
    format: string | null;
    processed: string | null;
  };
  image?: {
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
  };
}

export const SectionHeaderBlock: FC<SectionHeaderBlockProps> = ({
  title,
  description,
  image,
  className,
}) => {
  return (
    <Container className={cn("px-0", className)}>
      <SectionHeader
        title={title}
        image={{
          url: image?.url,
          alt: image?.alt,
        }}
        // subtitle="Looking for a path to success?"
      >
        <DescriptionBlock {...description} />
      </SectionHeader>
    </Container>
  );
};
