import type { Meta, StoryObj } from "@storybook/react";

import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";

const meta = {
  component: DatePicker,
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

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
        name="date"
        label="Date picker label"
        required
        control={(props) => <DatePicker {...props} {...args} />}
        description="This is a description for the date picker field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
