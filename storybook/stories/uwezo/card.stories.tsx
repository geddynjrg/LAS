import type { Meta, StoryObj } from "@storybook/react";

import { Card, cardVariants } from "@workspace/ui/components/uwezo/card";

const meta = {
  component: Card,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: cardVariants.variants.variant,
    },
    radius: {
      control: { type: "select" },
      options: cardVariants.variants.radius,
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <Card {...props}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
      cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
      est laborum.
    </Card>
  ),
} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {cardVariants.variants.variant.map((variant) => (
        <Card key={variant} {...props} variant={variant}>
          <span className="p-4">{variant}</span>
        </Card>
      ))}
    </div>
  ),
} satisfies Story;

export const Radiuses = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {cardVariants.variants.radius.map((radius) => (
        <Card key={radius} {...props} radius={radius}>
          <span className="p-4">{radius}</span>
        </Card>
      ))}
    </div>
  ),
} satisfies Story;
