import type { Meta, StoryObj } from "@storybook/react";

import { Badge, badgeVariants } from "@workspace/ui/components/badge";

/**
 * TODO: Update visuals based on figma
 */
const meta = {
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    children: "Badge",
    radius: "md",
  },
  argTypes: {
    variant: {
      control: {
        type: "select",
      },
      options: badgeVariants.variants.variant,
    },
    radius: {
      control: {
        type: "select",
      },
      options: badgeVariants.variants.radius,
    },
  },
} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {badgeVariants.variants.variant.map((variant) => (
        <Badge key={variant} {...props} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
} satisfies Story;

export const Radius = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {badgeVariants.variants.radius.map((radius) => (
        <Badge key={radius} {...props} radius={radius}>
          {radius}
        </Badge>
      ))}
    </div>
  ),
} satisfies Story;
