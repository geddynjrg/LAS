import type { Meta, StoryObj } from "@storybook/react";

import { GalleryBlock } from "@workspace/ui/components/tvet/blocks/gallery-block";

const meta = {
  component: GalleryBlock,
  args: {
    block_type: "gallery",
    title: "Gallery Title",
    description: {
      value: "Description",
      format: "full_html",
      processed: "Description",
    },
    images: [
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
      {
        title: "Image Title",
        type: "image",
        id: "1",
        uuid: "1",
        name: "image.jpg",
        url: "https://placehold.co/640x480",
        bundle: "image",
        mime_type: "image/jpeg",
        size: 150,
        alt: "Image Alt",
        width: "400",
        height: "400",
      },
    ],
  },
} satisfies Meta<typeof GalleryBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
