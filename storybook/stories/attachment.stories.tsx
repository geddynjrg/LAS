import type { Meta, StoryObj } from "@storybook/react";

import { Attachment } from "@workspace/ui/components/attachment";

const meta = {
  component: Attachment,
  args: {
    children: "attachment_name.pdf",
    onDelete: () => alert("Attachment deleted"),
  },
} satisfies Meta<typeof Attachment>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Error = {
  args: {
    error: "Sample error message",
  },
} satisfies Story;
