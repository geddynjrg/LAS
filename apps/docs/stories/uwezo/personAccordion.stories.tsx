import type { Meta, StoryObj } from "@storybook/react";

import {
  PersonAccordion,
  PersonAccordionContent,
  PersonAccordionItem,
  PersonAccordionTrigger,
} from "@workspace/ui/components/uwezo/personAccordion";

const meta = {
  component: PersonAccordion,
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["single", "multiple"],
    },
    collapsible: {
      control: { type: "boolean" },
    },
  },
  args: {
    type: "single",
    collapsible: true,
    disabled: false,
  },
} satisfies Meta<typeof PersonAccordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <PersonAccordion {...props}>
      <PersonAccordionItem value="item-1">
        <PersonAccordionTrigger>Accordion text</PersonAccordionTrigger>
        <PersonAccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </PersonAccordionContent>
      </PersonAccordionItem>
    </PersonAccordion>
  ),
} satisfies Story;
