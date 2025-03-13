import { IconCertificate2, IconCoins, IconId } from "@tabler/icons-react";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

import { DescriptionBlock } from "@/components/description-block";
import type { ApplicationBlockType } from "@/lib/api/types";

export interface ApplicationBlockProps extends ApplicationBlockType {}

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
        <DescriptionBlock {...description} className="typo-h3" />
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
