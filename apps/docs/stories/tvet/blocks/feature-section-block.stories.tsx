import type { Meta, StoryObj } from "@storybook/react";

import { FeatureSectionBlock } from "@workspace/ui/components/tvet/blocks/feature-section-block";

const meta = {
  component: FeatureSectionBlock,
  args: {
    block_type: "feature_section",
    description: {
      value: "Description",
      format: "full_html",
      processed: "Description",
    },
    features: [
      {
        block_type: "feature",
        feature: "Feature Title",
        short_description: {
          value: "Feature Description",
          format: "full_html",
          processed: "Feature Description",
        },
      },
      {
        block_type: "feature",
        feature: "Feature 2 Title",
        short_description: {
          value: "Feature Description",
          format: "full_html",
          processed: "Feature Description",
        },
      },
      {
        block_type: "feature",
        feature: "Feature 3 Title",
        short_description: {
          value: "Feature Description",
          format: "full_html",
          processed: "Feature Description",
        },
      },
    ],
  },
} satisfies Meta<typeof FeatureSectionBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
