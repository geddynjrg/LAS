import type { Meta, StoryObj } from "@storybook/react";
import { IconArrowRight, IconTools } from "@tabler/icons-react";

import {
  BulletBox,
  bulletBoxVariants,
} from "@workspace/ui/components/bullet-box";

const meta = {
  component: BulletBox,
  parameters: {
    docs: {
      description: {
        component:
          "This component displays a rounded square bullet box with content such as an icon or a short string.",
      },
    },
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: bulletBoxVariants.variants.size,
    },
  },
  args: {
    children: "B",
  },
} satisfies Meta<typeof BulletBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Sizes = {
  render: (props) => (
    <div className="flex flex-wrap items-center gap-4">
      {bulletBoxVariants.variants.size.map((size) => (
        <BulletBox key={size} {...props} size={size}>
          {size}
        </BulletBox>
      ))}
    </div>
  ),
} satisfies Story;

export const Icons = {
  render: ({ ...props }) => (
    <div className="flex flex-wrap items-center gap-4">
      {bulletBoxVariants.variants.size.map((size) => (
        <BulletBox key={size} {...props} size={size}>
          <IconArrowRight />
        </BulletBox>
      ))}
      {bulletBoxVariants.variants.size.map((size) => (
        <BulletBox key={size} {...props} size={size}>
          <IconTools />
        </BulletBox>
      ))}
    </div>
  ),
} satisfies Story;
