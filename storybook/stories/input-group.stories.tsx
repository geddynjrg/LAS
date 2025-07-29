import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { InputGroup } from "@workspace/ui/components/input-group";
import { Select } from "@workspace/ui/components/select";

const meta = {
  component: InputGroup,
  args: {
    children: (
      <>
        <Input placeholder="First name" />
        <Select
          placeholder="Select an option"
          options={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
          ]}
        />
        <Button className="flex-0">Submit</Button>
      </>
    ),
  },
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
