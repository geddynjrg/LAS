import type { Meta, StoryObj } from "@storybook/react";

import { Logo } from "@workspace/ui/components/tvet/logo";

const meta = {
  component: Logo,
  title: "TVET/Logo",
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * SVG Logo as component.
 */
export const Primary = {} satisfies Story;
