import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

const meta = {
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (_props) => {
    const [state, action, isPending] = useForm(formAction, schema);

    return (
      <Form className="space-y-6" action={action}>
        <Field
          state={state}
          name="input"
          label="Input label"
          required
          control={(props) => <Input {...props} />}
          description="This is a description for the input field"
        />

        <Field
          state={state}
          name="select"
          label="Select label"
          required
          control={(props) => <Select options={mockOptions} {...props} />}
          description="This is a description for the select field"
        />

        <Field
          state={state}
          name="checkbox"
          label="Checkbox label"
          description="This is a description for the checkbox field"
          required
          control={(props) => (
            <Checkbox {...props}>I agree to the terms</Checkbox>
          )}
        />

        <Field
          state={state}
          name="searchInput"
          label="Search Input label"
          required
          control={(props) => <SearchInput {...props} options={mockOptions} />}
          description="This is a description for the search input field"
        />

        <Field
          state={state}
          name="date"
          label="Date label"
          required
          control={(props) => <DatePicker {...props} />}
          description="This is a description for the date picker field"
        />

        <SubmitButton disabled={isPending}>Submit</SubmitButton>
      </Form>
    );
  },
};

const schema = z.object({
  input: z.string().min(3).max(10),
  select: z.union([z.literal("1"), z.literal("2"), z.literal("3")]),
  checkbox: z
    .union([z.literal("on"), z.null()])
    .refine((v) => !!v, "Please agree to the terms"),
  searchInput: z.string().nonempty(),
  date: z.coerce.date(),
});

const formAction: FormAction<z.infer<typeof schema>> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, schema);

  const { error, data, success } = schema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  alert(JSON.stringify(data, null, 2));

  return { success, test: 123 };
};

const mockOptions = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
] as const;
