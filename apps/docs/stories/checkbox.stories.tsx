import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox, checkboxVariants } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";

const meta = {
  component: Checkbox,
  argTypes: {
    size: {
      control: {
        type: "select",
        options: checkboxVariants.variants.size,
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithLabel = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
} satisfies Story;

export const Sizes = {
  render: () => (
    <div className="space-y-2">
      {checkboxVariants.variants.size.map((size) => (
        <div key={size} className="flex items-center space-x-2">
          <Checkbox id={`size-${size}`} size={size} />
          <Label htmlFor={`size-${size}`}>{size}</Label>
        </div>
      ))}
    </div>
  ),
} satisfies Story;
