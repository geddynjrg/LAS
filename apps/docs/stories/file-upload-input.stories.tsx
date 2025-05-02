import type { Meta, StoryObj } from "@storybook/react";

import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { formatBytes } from "@workspace/ui/lib/utils";

const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

const meta = {
  component: FileUploadInput,
  args: {
    accept: {
      "image/*": [".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
  },
} satisfies Meta<typeof FileUploadInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const FilesOnly = {
  args: {
    accept: {
      "application/pdf": [".pdf"],
    },
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
        name="upload"
        label="Upload File"
        required
        control={(props) => <FileUploadInput {...props} {...args} />}
        description={`Max file size ${formatBytes(MAX_FILE_SIZE)}`}
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
