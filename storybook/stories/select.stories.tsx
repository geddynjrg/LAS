import type { Meta, StoryObj } from "@storybook/react";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Select, selectVariants } from "@workspace/ui/components/select";

const meta = {
  component: Select,
  argTypes: {
    size: {
      control: { type: "select" },
      options: selectVariants.variants.size,
    },
  },
  args: {
    placeholder: "Select an option",
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Disabled = {
  args: {
    disabled: true,
  },
} satisfies Story;

export const Invalid = {
  args: {
    invalid: true,
  },
} satisfies Story;

export const ManyOptions = {
  args: {
    options: Array.from({ length: 100 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: String(i + 1),
    })),
  },
} satisfies Story;

export const WithFormField = {
  render: (args) => (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        alert("Submitted");
      }}
    >
      <Field
        name="select"
        label="select label"
        required
        control={(props) => <Select {...props} {...args} />}
        description="This is a description for the input field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
