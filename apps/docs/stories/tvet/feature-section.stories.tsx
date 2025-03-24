import type { Meta, StoryObj } from "@storybook/react";

import { FeatureSection } from "@workspace/ui/components/tvet/feature-section";

const meta = {
  component: FeatureSection,
  args: {
    features: [
      {
        title: "Feature Title",
        text: "Feature Description",
        icon: null,
      },
      {
        title: "Feature 2 Title",
        text: "Feature Description",
        icon: null,
      },
      {
        title: "Feature 3 Title",
        text: "Feature Description",
        icon: null,
      },
    ],
  },
} satisfies Meta<typeof FeatureSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
