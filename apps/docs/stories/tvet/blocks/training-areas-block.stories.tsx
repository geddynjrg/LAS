import type { Meta, StoryObj } from "@storybook/react";

import { TrainingAreasBlock } from "@workspace/ui/components/tvet/blocks/training-areas-block";

const meta = {
  component: TrainingAreasBlock,
  args: {
    block_type: "training_areas",
    areas: [
      {
        course_count: 5,
        id: "1",
        name: "Training Area 1",
      },
      {
        course_count: 10,
        id: "2",
        name: "Training Area 2",
      },
      {
        course_count: 15,
        id: "3",
        name: "Training Area 3",
      },
    ],
  },
} satisfies Meta<typeof TrainingAreasBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
