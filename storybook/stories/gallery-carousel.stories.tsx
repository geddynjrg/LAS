import type { Meta, StoryObj } from "@storybook/react";

import { GalleryCarousel } from "@workspace/ui/components/gallery-carousel";

const meta = {
  component: GalleryCarousel,
  args: {
    images: [
      { url: "https://placehold.co/1920x1080", alt: "Image 1" },
      { url: "https://placehold.co/1920x1080", alt: "Image 2" },
      { url: "https://placehold.co/1920x1080", alt: "Image 3" },
      { url: "https://placehold.co/1920x1080", alt: "Image 4" },
      { url: "https://placehold.co/1920x1080", alt: "Image 5" },
      { url: "https://placehold.co/1920x1080", alt: "Image 6" },
    ],
  },
} satisfies Meta<typeof GalleryCarousel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => <GalleryCarousel images={props.images} />,
} satisfies Story;
