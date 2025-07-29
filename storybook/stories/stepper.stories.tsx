import type { Meta, StoryObj } from "@storybook/react";

import { Stepper } from "@workspace/ui/components/stepper";

const meta = {
  component: Stepper,
  args: {
    steps: ["Applicant", "Guardian", "Course", "Confirmations", "Payment"],
    activeStep: 2,
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
