import type { Meta, StoryObj } from "@storybook/react";

import { Combobox } from "@workspace/ui/components/combobox";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";

const meta = {
  component: Combobox,
  args: {
    options: [
      { label: "Next.js", value: "next.js" },
      { label: "SvelteKit", value: "sveltekit" },
      { label: "Nuxt.js", value: "nuxt.js" },
      { label: "Remix", value: "remix" },
      { label: "Astro", value: "astro" },
    ],
  },
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithForm = {
  render: (args) => (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        alert("Submitted");
      }}
    >
      <Field
        name="combobox-input"
        label="Combobox Input label"
        required
        control={(props) => <Combobox {...props} {...args} />}
        description="This is a description for the combobox input field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;
