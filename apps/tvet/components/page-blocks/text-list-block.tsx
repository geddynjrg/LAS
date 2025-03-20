import type { FC, ReactNode } from "react";

import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

import { Heading } from "@/components/heading";
import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { TextListBlockType } from "@/lib/api/schema/block/text-list-block.schema";

export interface TextListBlockProps extends TextListBlockType {}

export const TextListBlock: FC<TextListBlockProps> = ({
  title,
  short_description,
  items,
}) => {
  return (
    <section className="app-container flex flex-col gap-4 px-4 py-10">
      <Heading type="h3">{title}</Heading>
      <DescriptionBlock {...short_description} />
      <NumberedList variant="bulletNumbers" className="typo-h6 gap-y-4">
        {items.map((item, index) => (
          <NumberedListItem key={index}>{item}</NumberedListItem>
        ))}
      </NumberedList>
    </section>
  );
};
