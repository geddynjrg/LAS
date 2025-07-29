import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox, checkboxVariants } from "@workspace/ui/components/checkbox";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";

const meta = {
  component: Checkbox,
  argTypes: {
    size: {
      control: { type: "select" },
      options: checkboxVariants.variants.size,
    },
  },
  args: {
    children: "Accept terms and conditions",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Sizes = {
  render: () => (
    <div className="space-y-2">
      {checkboxVariants.variants.size.map((size) => (
        <Checkbox key={size} id={`size-${size}`} size={size}>
          {size}
        </Checkbox>
      ))}
    </div>
  ),
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
        name="checkbox"
        label="Accept terms and conditions"
        required
        control={(props) => <Checkbox {...props} {...args} />}
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
