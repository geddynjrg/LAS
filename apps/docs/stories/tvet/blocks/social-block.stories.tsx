import type { Meta, StoryObj } from "@storybook/react";

import { SocialBlock } from "@workspace/ui/components/tvet/blocks/social-block";

const meta = {
  component: SocialBlock,
  args: {
    block_type: "social_block",

    social_links: [
      {
        url: "https://facebook.com",
        account: "facebook",
        platform: "facebook",
        icon: "facebook",
      },
      {
        url: "https://twitter.com",

        icon: "twitter",
        platform: "twitter",
        account: "twitter",
      },
      {
        url: "https://instagram.com",
        icon: "instagram",
        platform: "instagram",
        account: "instagram",
      },
    ],
  },
} satisfies Meta<typeof SocialBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
