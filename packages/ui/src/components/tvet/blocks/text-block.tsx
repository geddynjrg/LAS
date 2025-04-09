import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { cn } from "@workspace/ui/lib/utils";

export interface TextBlockProps {
  className?: string;
  block_type: "text_block";
  title?: string;
  description?: {
    value: string | null;
    format: string | null;
    processed: string | null;
  };
}

export const TextBlock: FC<TextBlockProps> = ({
  title,
  description,
  className,
}) => {
  return (
    <section>
      <Container
        className={cn(
          "mt-4 flex flex-col gap-2 px-4 py-10 lg:gap-4",
          className,
        )}
      >
        {title && <Heading type="h2">{title}</Heading>}
        <DescriptionBlock {...description} />
      </Container>
    </section>
  );
};
