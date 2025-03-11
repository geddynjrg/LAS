import type { Meta, StoryObj } from "@storybook/react";
import { z } from "zod";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import {
  Field,
  FieldGroup,
  Form,
  SubmitButton,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { formatBytes, getFormDataValues } from "@workspace/ui/lib/utils";

const MAX_FILE_SIZE = 1e6; // 1 MB

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
          name="search"
          label="Search Input label"
          required
          control={(props) => <SearchInput {...props} options={mockOptions} />}
          description="This is a description for the search input field"
        />

        <FieldGroup
          label="Phone Number"
          description="Enter your phone number"
          required
        >
          <Field
            state={state}
            name="callingCode"
            className="max-w-40"
            required
            control={(props) => <CallingCodeSelect {...props} />}
          />
          <Field
            state={state}
            name="phone"
            required
            control={(props) => <Input type="tel" {...props} />}
          />
        </FieldGroup>

        <Field
          state={state}
          name="date"
          label="Date label"
          required
          control={(props) => <DatePicker {...props} />}
          description="This is a description for the date picker field"
        />

        <Field
          state={state}
          name="buttonGroup"
          label="Button group label"
          required
          control={(props) => (
            <ButtonGroup {...props} type="single">
              <ButtonGroupItem value="a">A</ButtonGroupItem>
              <ButtonGroupItem value="b">B</ButtonGroupItem>
              <ButtonGroupItem value="c">C</ButtonGroupItem>
            </ButtonGroup>
          )}
          description="This is a description for the button group field"
        />

        <Field
          state={state}
          name="slider"
          label="Slider label"
          required
          control={(props) => <Slider {...props} min={1} max={12} />}
          description="This is a description for the slider field"
        />

        <Field
          state={state}
          name="radioGroup"
          label="Radio group label"
          required
          control={(props) => (
            <RadioGroup
              {...props}
              options={[
                { label: "Option 1", value: "1" },
                { label: "Option 2", value: "2" },
                { label: "Option 3", value: "3" },
              ]}
            />
          )}
          description="This is a description for the radio group field"
        />

        <Field
          state={state}
          name="upload"
          label="Upload File"
          required
          control={(props) => (
            <FileUploadInput
              accept={{
                "image/*": [".jpg", ".png"],
                "application/pdf": [".pdf"],
              }}
              maxSize={MAX_FILE_SIZE}
              {...props}
            />
          )}
          description={`Max file size ${formatBytes(MAX_FILE_SIZE)}`}
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
  search: z.string().nonempty(),
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
  date: z.coerce.date(),
  buttonGroup: z.string().nonempty(),
  radioGroup: z.string().nonempty(),
  slider: z.coerce.number().min(1).max(12),
  upload: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
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
