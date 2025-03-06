import type { Meta, StoryObj } from "@storybook/react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";

const meta = {
  component: DataBlock,
  args: {
    active: true,
    children: (
      <>
        <DataNode label="Child title 1">Child element 1</DataNode>
        <DataNode label="Child title 2">Child element 2</DataNode>
        <DataNode label="Child title 3">Child element 3</DataNode>
      </>
    ),
    description: "Description for a DataBlock component looks like this.",
    disabled: false,
    onCancel: () => console.log("Cancel called"),
    onSubmit: () => console.log("Cancel called"),
    title: "Title for DataBlock",
  },
} satisfies Meta<typeof DataBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
