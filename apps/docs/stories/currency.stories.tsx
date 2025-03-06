import type { Meta, StoryObj } from "@storybook/react";

import { Currency } from "@workspace/ui/components/currency";

const meta = {
  component: Currency,
  args: {
    amount: 1000,
    currency: "USD",
    className: "",
  },
} satisfies Meta<typeof Currency>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => <Currency {...props} />,
} satisfies Story;
