import type { Meta, StoryObj } from "@storybook/react";
import { IconCheck } from "@tabler/icons-react";

import { MetricCard } from "@workspace/ui/components/uwezo/metric-card";

const meta = {
  component: MetricCard,
} satisfies Meta<typeof MetricCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    icon: <IconCheck />,
    title: "youth groups",
    count: 26409,
  },
  render: (args) => <MetricCard {...args} />,
} satisfies Story;
