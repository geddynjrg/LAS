import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Underline } from "@workspace/ui/components/underline";

import { DescriptionBlock } from "@/components/description-block";
import { Heading } from "@/components/heading";
import type { FrontTextBlockType } from "@/lib/api/types";

export interface FrontTextBlockProps extends FrontTextBlockType {}

export const FrontTextBlock: FC<FrontTextBlockProps> = ({
  title,
  description,
}) => {
  return (
    <Container className="mt-4 flex flex-col gap-2 px-4 py-10 lg:gap-4">
      <Heading type="h2">{title}</Heading>
      <DescriptionBlock {...description} />
      <Underline asChild>
        <Link href="/sponsorship">
          Learn more about sponsorships <IconArrowRight />
        </Link>
      </Underline>
    </Container>
  );
};
