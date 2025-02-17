import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select } from "@workspace/ui/components/select";

const meta = {
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (_props) => {
    return (
      <Form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Submitted");
        }}
      >
        <Field
          name="input"
          label="Input label"
          required
          control={(props) => <Input {...props} />}
          description="This is a description for the input field"
        />

        <Field
          name="select"
          label="Select label"
          required
          control={(props) => (
            <Select
              options={[
                { label: "Option 1", value: "1" },
                { label: "Option 2", value: "2" },
                { label: "Option 3", value: "3" },
              ]}
              {...props}
            />
          )}
          description="This is a description for the select field"
        />

        <Field
          name="checkbox"
          label="Checkbox label"
          description="This is a description for the checkbox field"
          required
          control={(props) => (
            <Checkbox id={props.id}>I agree to the terms</Checkbox>
          )}
        />

        <SubmitButton>Submit</SubmitButton>
      </Form>
    );
  },
};
