import type { Meta, StoryObj } from "@storybook/react";

import { Alert, alertVariants } from "@workspace/ui/components/alert";

const meta = {
  component: Alert,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: alertVariants.variants.variant,
    },
    position: {
      control: { type: "select" },
      options: alertVariants.variants.position,
    },
  },
  args: {
    children: "Alert child as simple text",
    title: "Title for alert box",
    hasIcon: true,
    variant: "info",
    position: "local",
    onClose: () => console.log("Closing initialized"),
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
