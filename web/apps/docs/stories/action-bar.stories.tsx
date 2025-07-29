import type { Meta, StoryObj } from "@storybook/react";
import { IconCheck } from "@tabler/icons-react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";

const meta = {
  component: ActionBar,
  args: {
    children: (
      <>
        <Button className="bg-red-400">Back</Button>
        <Button>
          Confirm
          <IconCheck />
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof ActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Sticky = {
  render: (props) => (
    <div className="relative h-[400px] overflow-auto">
      <div className="h-[600px] bg-neutral-400" />
      <ActionBar {...props} />
      <div className="h-[200px] bg-neutral-600" />
    </div>
  ),
} satisfies Story;
