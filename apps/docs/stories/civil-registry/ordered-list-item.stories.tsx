import type { Meta, StoryObj } from "@storybook/react";

import {
  OrderedListItem,
  OrderedListItemWrap,
} from "@workspace/ui/components/civil-registry/ordered-list-item";

const meta = {
  component: OrderedListItem,
  args: {
    title: "Title",
    children: "Child content",
  },
  decorators: [
    (Story) => (
      <OrderedListItemWrap>
        <Story />
        <OrderedListItem title="Title 2">Child content 2</OrderedListItem>
        <OrderedListItem title="Title 3">Child content 3</OrderedListItem>
      </OrderedListItemWrap>
    ),
  ],
} satisfies Meta<typeof OrderedListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
