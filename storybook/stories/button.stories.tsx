import type { Meta, StoryObj } from "@storybook/react";
import { IconArrowRight } from "@tabler/icons-react";

import { Button, buttonVariants } from "@workspace/ui/components/button";

const meta = {
  component: Button,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: buttonVariants.variants.variant,
    },
    size: {
      control: { type: "select" },
      options: buttonVariants.variants.size,
    },
  },
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {buttonVariants.variants.variant.map((variant) => (
        <Button key={variant} {...props} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
} satisfies Story;

export const DisabledVariants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {buttonVariants.variants.variant.map((variant) => (
        <Button key={variant} {...props} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </div>
  ),
} satisfies Story;

export const Sizes = {
  render: (props) => (
    <div className="flex flex-wrap items-center gap-4">
      {buttonVariants.variants.size.map((size) => (
        <Button key={size} {...props} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
} satisfies Story;

export const Icons = {
  render: ({ children, ...props }) => (
    <div className="flex flex-wrap items-center gap-4">
      {buttonVariants.variants.size.map((size) => (
        <Button key={size} {...props} size={size}>
          <IconArrowRight />
        </Button>
      ))}
      {buttonVariants.variants.size.map((size) => (
        <Button key={size} {...props} size={size}>
          {children} <IconArrowRight />
        </Button>
      ))}
    </div>
  ),
} satisfies Story;
