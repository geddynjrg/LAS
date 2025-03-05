import type { Meta, StoryObj } from "@storybook/react";

import {
  FlagSelect,
  flagSelectVariants,
} from "@workspace/ui/components/flag-select";

const meta = {
  component: FlagSelect,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: flagSelectVariants.variants.variant,
    },
  },
  args: {
    defaultValue: "en",
    options: [
      { value: "en", label: "ENG" },
      { value: "sw", label: "SWA" },
    ],
    onChange: (value: string) => alert(value),
  },
} satisfies Meta<typeof FlagSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
