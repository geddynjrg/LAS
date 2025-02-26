import type { Meta, StoryObj } from "@storybook/react";

import { TrainingAreaCard } from "@workspace/ui/components/tvet/training-area-card";

const meta = {
  component: TrainingAreaCard,
} satisfies Meta<typeof TrainingAreaCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    title: "Hello World",
    children: "This is a label card",
    onClick: () => alert("Clicked"),
  },
} satisfies Story;
