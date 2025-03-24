import type { Meta, StoryObj } from "@storybook/react";

import { ApplicationBlock } from "@workspace/ui/components/tvet/blocks/application-block";

const meta = {
  component: ApplicationBlock,
  args: {
    block_type: "application",
    title: "Application process and admission details",
    description: {
      value:
        "<hr><p><strong>Intake Periods</strong></p><p>Nairobi VTCs have<strong> three main intakes per year:</strong></p><ul><li><strong>January</strong></li><li><strong>May</strong></li><li><strong>September</strong></li></ul><p>&nbsp;</p><p>Most Centres also offer <strong>rolling admissions </strong>for short courses, meaning students can <strong>join throughout the year based</strong> on course<strong> </strong>availability.</p><p>&nbsp;</p><p>&nbsp;</p>",
      format: "full_html",
      processed:
        "<hr><p><strong>Intake Periods</strong></p><p>Nairobi VTCs have<strong> three main intakes per year:</strong></p><ul><li><strong>January</strong></li><li><strong>May</strong></li><li><strong>September</strong></li></ul><p>&nbsp;</p><p>Most Centres also offer <strong>rolling admissions </strong>for short courses, meaning students can <strong>join throughout the year based</strong> on course<strong> </strong>availability.</p><p>&nbsp;</p><p>&nbsp;</p>",
    },
    checkpoints: [
      "National ID or birth certificate",
      "Some courses may require educational certificates (KCSE, KCPE, or equivalent)",
      "250 KSh to pay the application fee",
    ],
  },
} satisfies Meta<typeof ApplicationBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
