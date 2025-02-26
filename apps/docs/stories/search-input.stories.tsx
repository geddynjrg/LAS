import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { SearchInput } from "@workspace/ui/components/search-input";

const meta = {
  component: SearchInput,
  args: {
    placeholder: "Search...",
    options: [
      { value: "calendar", label: "Calendar" },
      { value: "search-emoji", label: "Search Emoji" },
      { value: "calculator", label: "Calculator" },
    ],
  },
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Async = {
  render: (props) => {
    const [options, setOptions] = useState<{ label: string; value: string }[]>(
      [],
    );
    const [isLoading, setIsLoading] = useState(false);

    async function handleSearch(search: string) {
      setIsLoading(true);
      setOptions(await dummyFetchSuggestions(search));
      setIsLoading(false);
    }

    return (
      <SearchInput
        {...props}
        isLoading={isLoading}
        options={options}
        onValueChange={handleSearch}
      />
    );
  },
} satisfies Story;

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
        name="search-input"
        label="Search Input label"
        required
        control={(props) => <SearchInput {...props} {...args} />}
        description="This is a description for the search input field"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
} satisfies Story;

async function dummyFetchSuggestions(search: string) {
  const options = Array.from({ length: 5 }, (_, i) => ({
    value: `option-${i + 1}- ${search}`,
    label: `Option ${i + 1}: ${search}`,
  }));

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return options;
}
