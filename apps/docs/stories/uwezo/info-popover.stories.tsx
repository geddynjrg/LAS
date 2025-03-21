import type { Meta, StoryObj } from "@storybook/react";

import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";
import { cn } from "@workspace/ui/lib/utils";

const meta = {
  component: InfoPopover,
  args: {
    floating: false,
  },
} satisfies Meta<typeof InfoPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <div className={cn("flex justify-center", "min-h-[300px]")}>
      <InfoPopover {...props} />
    </div>
  ),
} satisfies Story;
