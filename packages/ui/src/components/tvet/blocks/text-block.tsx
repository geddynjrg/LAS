import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";

export interface TextBlockProps {
  block_type: "text_block";
  title: string;
  description: {
    value: string;
    format: string;
    processed: string;
  };
}

export const TextBlock: FC<TextBlockProps> = ({ title, description }) => {
  return (
    <section>
      <Container className="mt-4 flex flex-col gap-2 px-4 py-10 lg:gap-4">
        <Heading type="h2">{title}</Heading>
        <DescriptionBlock {...description} />
      </Container>
    </section>
  );
};
