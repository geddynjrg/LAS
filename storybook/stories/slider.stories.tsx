import type { Meta, StoryObj } from "@storybook/react";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Slider } from "@workspace/ui/components/slider";

const meta = {
  component: Slider,
  args: {
    min: 1,
    max: 12,
    defaultValue: 1,
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithDecorators = {
  args: {
    startDecorator: "1 month",
    endDecorator: "12 months",
  },
} satisfies Story;

export const WithLabel = {
  args: {
    defaultValue: 6,
    thumbLabel: (value) => `${value} months`,
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
        name="slider"
        label="Slider label"
        required
        control={(props) => <Slider {...props} {...args} />}
        description="This slider allows you to select a value between the defined range."
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
