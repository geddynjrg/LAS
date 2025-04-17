import type { Meta, StoryObj } from "@storybook/react";

import { Logo } from "@workspace/ui/components/civil-registry/logo";

const meta = {
  component: Logo,
  args: {
    height: 120,
  },
  argTypes: {
    height: {
      type: "number",
      description: "Height of the logo",
      control: { type: "number" },
    },
    width: {
      type: "number",
      description: "Width of the logo",
      control: { type: "number" },
    },
    className: {
      type: "string",
      description: "Class name for the logo",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;
/**
 * SVG Logo as component.
 */
export const Primary = {} satisfies Story;
