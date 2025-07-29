import type { Meta, StoryObj } from "@storybook/react";
import { IconRecharging, IconTools } from "@tabler/icons-react";

import {
  NumberedList,
  NumberedListItem,
  numberedListVariants,
} from "@workspace/ui/components/numbered-list";

const meta = {
  component: NumberedList,
  parameters: {
    docs: {
      description: {
        component:
          "This component displays a list of items with big primary colored counter numbers.",
      },
    },
  },
  args: {
    variant: "numbers",
    children: ["Item 1", "Item 2", "Item 3"],
  },
  argTypes: {
    variant: {
      control: {
        type: "select",
      },
      options: numberedListVariants.variants.variant,
    },
    bulletAlignment: {
      control: {
        type: "select",
      },
      options: numberedListVariants.variants.bulletAlignment,
    },
  },
} satisfies Meta<typeof NumberedList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Numbered = {} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="flex items-center gap-8">
      {numberedListVariants.variants.variant.map((variant) => (
        <div key={variant} className="bg-neutral-100 p-8">
          <NumberedList {...props} variant={variant}>
            <NumberedListItem>Item 1</NumberedListItem>
            <NumberedListItem>Item 2</NumberedListItem>
            <NumberedListItem>Item 3</NumberedListItem>
          </NumberedList>
        </div>
      ))}
    </div>
  ),
} satisfies Story;

export const NumberedListItemsIconItems = {
  render: (props) => (
    <div className="w-120 gap-4 bg-neutral-100 p-8">
      <NumberedList {...props}>
        <NumberedListItem icon={<IconTools />}>
          Lorem ipsum dolor
        </NumberedListItem>
        <NumberedListItem icon={<IconRecharging />}>
          Donec hendrerit urna
        </NumberedListItem>
        <NumberedListItem icon={<IconTools />}>
          consectetur adipiscing elit
        </NumberedListItem>
      </NumberedList>
    </div>
  ),
} satisfies Story;
