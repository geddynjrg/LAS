import type { Meta, StoryObj } from "@storybook/react";

import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import {
  Field,
  FieldGroup,
  Form,
  SubmitButton,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";

const meta = {
  component: CallingCodeSelect,
} satisfies Meta<typeof CallingCodeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithPhoneNumber = {
  render: () => (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        alert("Submitted");
      }}
    >
      <FieldGroup label="Phone Number" description="Enter your phone number">
        <Field
          name="callingCode"
          className="max-w-40"
          required
          control={(props) => <CallingCodeSelect {...props} />}
        />
        <Field
          name="phone"
          required
          control={(props) => <Input type="tel" {...props} />}
        />
      </FieldGroup>

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
};
