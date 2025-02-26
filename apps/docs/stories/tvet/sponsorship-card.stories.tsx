import type { Meta, StoryObj } from "@storybook/react";

import { SponsorshipCard } from "@workspace/ui/components/tvet/sponsorship-card";

const meta = {
  component: SponsorshipCard,
  args: {
    title: "MPESA Foundation",
    description:
      "Eligibility is primarily for those who completed their KCSE and meet the placement criteria based on their exam results. Partially cover tuition fees.",
    applicationFormHref: "/path/to/application-form",
    websiteHref: "/path/to/website",
  },
} satisfies Meta<typeof SponsorshipCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
