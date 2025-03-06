import type { Meta, StoryObj } from "@storybook/react";

import { buttonVariants } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";

const meta = {
  component: BackButton,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: buttonVariants.variants.variant,
    },
  },
  args: {
    variant: "secondary",
  },
} satisfies Meta<typeof BackButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
