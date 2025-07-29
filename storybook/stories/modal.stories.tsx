import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@workspace/ui/components/modal";

const meta = {
  component: Modal,
  args: {
    size: "md",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "fluid"],
    },
  },
} satisfies Meta<typeof ModalContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <div className="flex gap-4">
      <Modal>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent {...props}>
          <ModalTitle>Are you absolutely sure?</ModalTitle>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">Cancel</Button>
            </ModalClose>
            <ModalClose asChild>
              <Button>Delete</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  ),
} satisfies Story;
