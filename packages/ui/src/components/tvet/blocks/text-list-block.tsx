import { IconDownload, IconHandFinger, IconSend } from "@tabler/icons-react";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";
import { Heading } from "@workspace/ui/components/tvet/heading";

type listType = "what_you_will_learn" | "how_to_apply_to_sponsorships" | string;

export interface TextListBlockProps {
  block_type: "text_list";
  title: string;
  type: listType;
  short_description: {
    value: string;
    format: string;
    processed: string;
  };
  items: string[];
}

export const TextListBlock: FC<TextListBlockProps> = ({
  title,
  type,
  short_description,
  items,
}) => {
  if (type === "how_to_apply_to_sponsorships") {
    return (
      <Container className="mt-4 flex flex-col gap-6 py-8">
        <h2 className="typo-h2">{title}</h2>
        <hr />

        <section>
          <h3 className="typo-h5">To apply, you need:</h3>
          <NumberedList className="my-4" variant="numbers">
            {items?.map((checkpoint, index) => (
              <NumberedListItem
                key={index}
                icon={<HowToApplyIcons index={index} />}
              >
                {checkpoint}
              </NumberedListItem>
            ))}
          </NumberedList>
        </section>
        <hr />
        <DescriptionBlock {...short_description} />
      </Container>
    );
  }

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

const HowToApplyIcons: FC<{ index: number }> = ({ index }) => {
  switch (index) {
    case 0:
      return <IconHandFinger />;
    case 1:
      return <IconDownload />;
    case 2:
      return <IconSend />;

    default:
      return null;
  }
};
