import type { Meta, StoryObj } from "@storybook/react";

import { LeadingSlash } from "@workspace/ui/components/leading-slash";

const meta = {
  component: LeadingSlash,
  argTypes: {
    asChild: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
    children: {
      control: "text",
    },
  },
  args: {
    asChild: false,
    className: "",
    children: "LeadingSlash",
  },
} satisfies Meta<typeof LeadingSlash>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => <LeadingSlash {...props} />,
} satisfies Story;
