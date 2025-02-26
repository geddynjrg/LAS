import type { Meta, StoryObj } from "@storybook/react";

import { ApplyCard } from "@workspace/ui/components/tvet/apply-card";

const meta = {
  component: ApplyCard,
  parameters: {
    docs: {
      description: {
        component:
          "This component displays a card with details about an application.",
      },
    },
  },
  args: {
    title: "Apply Now",
    tags: ["New", "Free"],
    fee: "Free",
    school: "School of Business",
    applyByDate: "12.02.24",
    startsOnDate: "12.02.24",
    borderColor: "green",
    href: "#",
  },
  argTypes: {
    borderColor: {
      control: { type: "color" },
    },
    variant: {
      control: {
        type: "select",
      },
      options: ["primary", "secondary"],
    },
    applyByDate: {
      type: "string",
      control: {
        type: "text",
      },
    },
    startsOnDate: {
      type: "string",
      control: {
        type: "text",
      },
    },
    href: {
      type: "string",
      control: {
        type: "text",
      },
    },
  },
} satisfies Meta<typeof ApplyCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Secondary = {
  args: {
    title: "Apply Now",
    tags: ["New", "Free"],
    fee: "Free",
    school: "School of Business",
    applyByDate: "12.02.24",
    startsOnDate: "12.02.24",
    borderColor: "blue",
    variant: "secondary",
    href: "#",
  },
} satisfies Story;
