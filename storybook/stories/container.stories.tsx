import type { Meta, StoryObj } from "@storybook/react";

import { Container } from "@workspace/ui/components/container";

const meta = {
  component: Container,
  args: {
    children:
      "The purpose of Container is to unify a max-width for all views. It's primary use-case is to hold content in it's boundaries, nothing else.",
    className: "bg-neutral-100",
  },
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
