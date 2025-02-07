import type { Meta, StoryObj } from "@storybook/react";

import { FlagSelect } from "@workspace/ui/components/flag-select";

const meta = {
  component: FlagSelect,
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
