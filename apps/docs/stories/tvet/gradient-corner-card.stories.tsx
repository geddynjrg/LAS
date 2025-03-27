import type { Meta, StoryObj } from "@storybook/react";

import { GradientCornerCard } from "@workspace/ui/components/tvet/gradient-corner-card";

const meta = {
  component: GradientCornerCard,
  args: {
    children: "Description",
    color: "green",
    gradient: "blend1",
  },
  argTypes: {
    color: {
      type: "string",
      description: "The color of the card.",
      options: ["green", "red", "blue"],
      control: {
        type: "select",
      },
    },
    gradient: {
      type: "string",
      description:
        "The gradient of the card (currently the same for all options).",
      options: ["blend1", "blend2", "blend3"],
      control: {
        type: "select",
      },
    },
  },
} satisfies Meta<typeof GradientCornerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
