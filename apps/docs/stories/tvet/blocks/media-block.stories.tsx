import type { Meta, StoryObj } from "@storybook/react";

import { MediaBlock } from "@workspace/ui/components/tvet/blocks/media-image-block";

const meta = {
  component: MediaBlock,
  args: {
    block_type: "media",
    media: [
      {
        title: "Image Title",
        type: "image",
        id: "1",
        uuid: "1",
        name: "image.jpg",
        url: "https://placehold.co/640x480",
        bundle: "image",
        mime_type: "image/jpeg",
        size: 400,
        alt: "Image Alt",
        width: "400",
        height: "400",
      },
    ],
  },
} satisfies Meta<typeof MediaBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
