import type { Meta, StoryObj } from "@storybook/react";

import { Testimonial } from "@workspace/ui/components/testimonial";

const meta = {
  component: Testimonial,
} satisfies Meta<typeof Testimonial>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    title: "John Doe",
    children: "This is a testimonial.",
    imageUrl: "https://placehold.jp/150x150.png",
  },
} satisfies Story;
