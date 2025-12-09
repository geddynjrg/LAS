import type { Meta, StoryObj } from "@storybook/react";

import { DataPair } from "@workspace/ui/components/data-pair";

const meta = {
  component: DataPair,
  args: {
    children: (
      <>
        <div style={{ background: "lightskyblue", padding: "1rem" }}>
          Content block 1
        </div>
        <div style={{ background: "pink", padding: "1rem" }}>
          Content block 2
        </div>
      </>
    ),
  },
} satisfies Meta<typeof DataPair>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Highlighted = {
  render: (props) => (
    <DataPair {...props}>
      <div style={{ background: "lightskyblue", padding: "1rem" }}>
        Content block 1
      </div>
      <div style={{ background: "pink", padding: "1rem" }}>Content block 2</div>
      <div style={{ background: "darkseagreen", padding: "1rem" }}>
        Content block 3
      </div>
    </DataPair>
  ),
} satisfies Story;
