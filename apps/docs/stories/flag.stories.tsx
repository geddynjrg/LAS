import type { Meta, StoryObj } from "@storybook/react";

import { Flag, flagVariants } from "@workspace/ui/components/flag";

const meta = {
  component: Flag,
  parameters: {
    docs: {
      description: {
        component:
          "This component displays a flag based on the provided code. The flag is from the react-flagpack package. https://flagpack.xyz/docs/flag-index/",
      },
    },
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: flagVariants.variants.size,
    },
  },
  args: {
    code: "en",
    size: "s",
  },
} satisfies Meta<typeof Flag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
