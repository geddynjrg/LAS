import type { Meta, StoryObj } from "@storybook/react";

import { checkboxVariants } from "@workspace/ui/components/checkbox";
import {
  CheckboxGroup,
  checkboxGroupVariants,
} from "@workspace/ui/components/checkbox-group";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";

const meta = {
  component: CheckboxGroup,
  argTypes: {
    size: {
      control: { type: "select" },
      options: checkboxVariants.variants.size,
    },
    orientation: {
      control: { type: "select" },
      options: checkboxGroupVariants.variants.orientation,
    },
  },
  args: {
    defaultValue: ["1"],
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
      { value: "3", label: "Option 3" },
    ],
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithFormField = {
  render: (args) => (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert("Submitted: " + (e.target as any).checkboxGroup.value);
      }}
    >
      <Field
        name="checkboxGroup"
        label="Input label"
        required
        control={(props) => <CheckboxGroup {...props} {...args} />}
        description="This is a description for the input field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
