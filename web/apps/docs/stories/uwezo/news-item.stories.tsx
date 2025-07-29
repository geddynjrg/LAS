import type { Meta, StoryObj } from "@storybook/react";

import { NewsItem } from "@workspace/ui/components/uwezo/news-item";

const meta = {
  component: NewsItem,
  args: {
    date: new Date(),
    href: "#",
    imageUrl: "https://placehold.co/600x400",
    linkTitle: "Link title",
    title: "Title",
  },
} satisfies Meta<typeof NewsItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
