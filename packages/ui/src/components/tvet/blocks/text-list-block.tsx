import type { FC } from "react";

import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";

export interface TextListBlockProps {
  block_type: "text_list";
  title: string;
  type: string;
  short_description: {
    value: string;
    format: string;
    processed: string;
  };
  items: string[];
}

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
