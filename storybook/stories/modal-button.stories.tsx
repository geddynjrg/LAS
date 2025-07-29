import type { Meta, StoryObj } from "@storybook/react";

import { ModalButton } from "@workspace/ui/components/modal-button";

const meta = {
  component: ModalButton,
  args: {
    modalTitle: "Title text",
    children: "Button child content",
    modalText: "Dialog text goes here, this is an example.",
    confirmTitle: "Confirm title",
    cancelTitle: "Cancel title",
    showX: false,
    onConfirm: () => alert("User clicked confirm"),
  },
} satisfies Meta<typeof ModalButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
