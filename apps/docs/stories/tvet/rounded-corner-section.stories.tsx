import type { Meta, StoryObj } from "@storybook/react";

import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";
import {
  RoundedCornerSection,
  RoundedCornerSectionHeader,
  roundedCornerSectionVariants,
} from "@workspace/ui/components/tvet/rounded-corner-section";

const meta = {
  component: RoundedCornerSection,
  args: {
    layout: "fluid",
  },
  argTypes: {
    layout: {
      control: { type: "radio" },
      options: roundedCornerSectionVariants.variants.layout,
    },
  },
} satisfies Meta<typeof RoundedCornerSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Rounded corner section folds the header to the left by default below LG size
 */
export const Primary = {
  render: (props) => (
    <RoundedCornerSection {...props}>
      <RoundedCornerSectionHeader className="bg-theme-400">
        <div className="p-6">Header</div>
      </RoundedCornerSectionHeader>
      <RoundedCornerCard>Content</RoundedCornerCard>
    </RoundedCornerSection>
  ),
} satisfies Story;

export const RoundedHeader = {
  render: (props) => (
    <RoundedCornerSection {...props} layout="stacked">
      <RoundedCornerSectionHeader className="bg-theme-400" variant="rounded">
        <div className="p-6">Header</div>
      </RoundedCornerSectionHeader>
      <RoundedCornerCard>Content</RoundedCornerCard>
    </RoundedCornerSection>
  ),
} satisfies Story;
