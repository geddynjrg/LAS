import type { Meta, StoryObj } from "@storybook/react";

import { Pagination } from "@workspace/ui/components/pagination";

const meta = {
  component: Pagination,
  args: {
    pageCount: 10,
    createPageURL: (pageNumber: number) => `?page=${pageNumber}`,
    disabled: false,
  },
  argTypes: {
    pageCount: {
      control: {
        type: "number",
        value: 10,
      },
    },
    disabled: {
      control: {
        type: "boolean",
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
