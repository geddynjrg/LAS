import type { Meta, StoryObj } from "@storybook/react";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import {
  RadioGroup,
  radioGroupVariants,
} from "@workspace/ui/components/radio-group";

const meta = {
  component: RadioGroup,
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: radioGroupVariants.variants.orientation,
    },
    size: {
      control: { type: "select" },
      options: radioGroupVariants.variants.size,
    },
  },
  args: {
    size: "md",
    orientation: "vertical",
    options: [
      { label: "Option 1", value: "1" },
      { label: "Option 2", value: "2" },
      { label: "Option 3", value: "3" },
    ],
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Horizontal = {
  args: {
    orientation: "horizontal",
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
        name="radioGroup"
        label="Radio group label"
        required
        control={(props) => <RadioGroup {...props} {...args} />}
        description="This is a description for the radio group field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
