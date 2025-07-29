import type { Meta, StoryObj } from "@storybook/react";

import { ApplySideLogo } from "@workspace/ui/components/uwezo/apply-side-logo";

const meta = {
  component: ApplySideLogo,
  args: {
    height: 120,
  },
} satisfies Meta<typeof ApplySideLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
