import type { Meta, StoryObj } from "@storybook/react";

import { FormCard } from "@workspace/ui/components/uwezo/form-card";

const meta = {
  component: FormCard,
  args: {
    title: "Form Card",
  },
} satisfies Meta<typeof FormCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => <FormCard {...props}>Form Card Content</FormCard>,
} satisfies Story;

export const WithSubtitle = {
  render: (props) => (
    <FormCard {...props} subtitle="Subtitle under title">
      Form Card Content
    </FormCard>
  ),
} satisfies Story;
