import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import { ScrollTo } from "@workspace/ui/components/scroll-to";

/**
 * Scroll to component.
 * It scrolls to the target element with the given id when clicked.
 * It uses the `useScrollTo` hook from `@workspace/ui/hooks/use-scroll-to`.
 */

const meta = {
  component: ScrollTo,
  args: {
    targetId: "target",
    children: "Scroll to target",
  },
} satisfies Meta<typeof ScrollTo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  args: {
    targetId: "target",
    children: "Scroll to target",
  },
  render: (args) => (
    <div style={{ padding: "20px" }}>
      <ScrollTo {...args}>
        <Button>Click here </Button>
      </ScrollTo>
    </div>
  ),
} satisfies Story;

export const Secondary = {
  args: {
    targetId: "target",
    children: "Scroll to target",
  },
  render: (args) => (
    <div style={{ height: "200vh", padding: "20px" }}>
      <ScrollTo {...args}>
        <Button>Click here </Button>
      </ScrollTo>
      <div
        id="target"
        style={{
          marginTop: "100vh",
          height: "100px",
          backgroundColor: "lightblue",
        }}
      >
        Target
      </div>
    </div>
  ),
} satisfies Story;
