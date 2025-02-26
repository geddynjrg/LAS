import type { Meta, StoryObj } from "@storybook/react";

import { Alert, alertVariants } from "@workspace/ui/components/alert";

const meta = {
  component: Alert,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: alertVariants.variants.variant,
    },
    position: {
      control: { type: "select" },
      options: alertVariants.variants.position,
    },
  },
  args: {
    children: "Alert child as simple text",
    title: "Title for alert box",
    hasIcon: true,
    variant: "info",
    position: "local",
    onClose: () => console.log("Closing initialized"),
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="space-y-4">
      {alertVariants.variants.variant.map((variant) => (
        <Alert {...props} key={variant} variant={variant} />
      ))}
    </div>
  ),
} satisfies Story;

export const Positions = {
  render: (props) => (
    <div className="space-y-4">
      {alertVariants.variants.position.map((position) => (
        <Alert {...props} key={position} position={position} />
      ))}
    </div>
  ),
} satisfies Story;

export const ContentOnly = {
  render: (props) => (
    <Alert {...props} title={undefined} onClose={undefined} hasIcon={false} />
  ),
} satisfies Story;
