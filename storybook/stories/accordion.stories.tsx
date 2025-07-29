import type { Meta, StoryObj } from "@storybook/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

const meta = {
  component: Accordion,
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["single", "multiple"],
    },
    collapsible: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
  args: {
    type: "single",
    collapsible: true,
    disabled: false,
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <Accordion {...props}>
      <AccordionItem value="item-1" disabled={props.disabled}>
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Story;

export const MultipleOpen = {
  render: () => (
    <Accordion type="multiple" className="flex flex-col gap-2">
      <AccordionItem value="item-1">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Story;

export const SingleOpen = {
  render: () => (
    <Accordion type="single" collapsible className="flex flex-col gap-2">
      <AccordionItem value="item-1">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Story;

export const Disabled = {
  render: () => (
    <Accordion type="single">
      <AccordionItem value="item-1" disabled>
        <AccordionTrigger>Accordion text</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
} satisfies Story;
