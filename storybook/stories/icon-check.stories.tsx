import type { Meta, StoryObj } from "@storybook/react";

import { IconCheck } from "@workspace/ui/components/icon-check";

const meta = {
  component: IconCheck,
} satisfies Meta<typeof IconCheck>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
