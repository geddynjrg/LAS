import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { TextBlockType } from "@/lib/api/types";

export interface TextBlockProps extends TextBlockType {}

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
