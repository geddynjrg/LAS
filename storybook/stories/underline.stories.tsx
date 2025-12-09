import type { Meta, StoryObj } from "@storybook/react";
import { IconArrowRight } from "@tabler/icons-react";

import {
  Underline,
  underlineVariants,
} from "@workspace/ui/components/underline";

const meta = {
  component: Underline,
  parameters: {
    docs: {
      description: {
        component:
          "This component adds an underline with specified variant color to its children and the same color to svg icons",
      },
    },
  },
  argTypes: {
    variant: {
      control: {
        type: "select",
      },
      options: underlineVariants.variants.variant,
    },
  },
  args: {
    children: <>Underline</>,
  },
} satisfies Meta<typeof Underline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Variants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4">
      {underlineVariants.variants.variant.map((variant) => (
        <Underline key={variant} {...props} variant={variant}>
          {variant}
        </Underline>
      ))}
    </div>
  ),
} satisfies Story;

export const IconVariants = {
  render: (props) => (
    <div className="flex flex-wrap gap-4 bg-gray-300 p-5">
      {underlineVariants.variants.variant.map((variant) => (
        <Underline key={variant} {...props} variant={variant} asChild>
          <a href="#link">
            {variant} <IconArrowRight />
          </a>
        </Underline>
      ))}
    </div>
  ),
} satisfies Story;
