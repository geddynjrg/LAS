import { IconCertificate2, IconCoins, IconId } from "@tabler/icons-react";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";
import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";

export interface ApplicationBlockProps {
  block_type: "application";
  className?: string;
  title: string;
  description: {
    value: string;
    format: string;
    processed: string;
  };
  checkpoints: string[];
}

export const ApplicationBlock: FC<ApplicationBlockProps> = ({
  title,
  description,
  checkpoints,
}) => {
  return (
    <Container className="mt-4 py-8">
      <h2 className="typo-h2">{title}</h2>
      <hr />

      <section className="mt-4">
        <NumberedList className="my-4" variant="numbers">
          {checkpoints?.map((checkpoint, index) => (
            <NumberedListItem
              key={index}
              icon={<CheckpointIcon index={index} />}
            >
              {checkpoint}
            </NumberedListItem>
          ))}
        </NumberedList>
        <DescriptionBlock {...description} />
      </section>
      <hr />
    </Container>
  );
};

const CheckpointIcon: FC<{ index: number }> = ({ index }) => {
  switch (index) {
    case 0:
      return <IconCoins />;
    case 1:
      return <IconId />;
    case 2:
      return <IconCertificate2 />;

    default:
      return null;
  }
};
