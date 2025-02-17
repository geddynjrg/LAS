import type { Meta, StoryObj } from "@storybook/react";

import { Flag, flagVariants } from "@workspace/ui/components/flag";

/**
 * Renders a flag based on the provided code. Uses the react-flagpack package. https://flagpack.xyz/docs/flag-index/
 */
const meta = {
  component: Flag,
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

export const Sizes = {
  render: () => (
    <div className="flex items-center gap-4">
      {flagVariants.variants.size.map((size) => (
        <Flag key={size} code="en" size={size} />
      ))}
    </div>
  ),
} satisfies Story;
