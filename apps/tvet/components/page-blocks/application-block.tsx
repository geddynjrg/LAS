import { IconCertificate2, IconCoins, IconId } from "@tabler/icons-react";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { ApplicationBlockType } from "@/lib/api/schema/block/application-block.schema";

export interface ApplicationBlockProps extends ApplicationBlockType {
  id?: string;
}

export const ApplicationBlock: FC<ApplicationBlockProps> = ({
  id,
  title,
  description,
  checkpoints,
}) => {
  return (
    <Container className="mt-4 py-8" id={id}>
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
