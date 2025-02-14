import type { Meta, StoryObj } from "@storybook/react";
import { IconMail, IconSearch } from "@tabler/icons-react";

import { Input, inputVariants } from "@workspace/ui/components/input";

const meta = {
  component: Input,
  args: {
    placeholder: "Placeholder text",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: inputVariants.variants.size,
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Sizes = {
  render: (props) => (
    <div className="flex items-center gap-4">
      {inputVariants.variants.size.map((size) => (
        <Input key={size} size={size} {...props} placeholder={size} />
      ))}
    </div>
  ),
} satisfies Story;

export const Invalid = {
  args: {
    invalid: true,
    defaultValue: "Invalid value",
  },
} satisfies Story;

export const Disabled = {
  args: {
    disabled: true,
    defaultValue: "Disabled value",
  },
} satisfies Story;

export const Icons = {
  args: {
    startDecorator: <IconMail />,
    endDecorator: <IconSearch />,
  },
} satisfies Story;
