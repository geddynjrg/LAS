import type { Meta, StoryObj } from "@storybook/react";

import { Pagination } from "@workspace/ui/components/pagination";

const meta = {
  component: Pagination,
  args: {
    pages: [...new Array(10)].map((_, i) => i),
    activePage: 1,
    disabled: false,
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
