import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

const meta = {
  component: Popover,
  args: {
    withArrow: true,
    side: "bottom",
  },
  argTypes: {
    withArrow: {
      control: {
        type: "boolean",
      },
    },
    side: {
      control: {
        type: "select",
      },
      options: ["top", "bottom", "left", "right"],
    },
    sideOffset: {
      control: {
        type: "number",
      },
    },
  },
} satisfies Meta<typeof PopoverContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    // "h-screen w-full" to make the area larger to test all sides
    <div className="flex items-center justify-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent
          title="Popover Title that is super super long"
          {...props}
        >
          Place content for the popover here.
          <PopoverFooter>
            <PopoverClose asChild>
              <Button variant="secondary" onClick={() => console.log("Reject")}>
                Cancel
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button onClick={() => console.log("Confirmed")}>Confirm</Button>
            </PopoverClose>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </div>
  ),
} satisfies Story;
