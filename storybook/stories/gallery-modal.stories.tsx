import type { Meta, StoryObj } from "@storybook/react";

import {
  GalleryModal,
  GalleryModalTrigger,
} from "@workspace/ui/components/gallery-modal";

const meta = {
  component: GalleryModal,
  args: {
    title: "Gallery",
    images: [
      { url: "https://placehold.co/1920x1080", alt: "Image 1" },
      { url: "https://placehold.co/1920x1080", alt: "Image 2" },
      { url: "https://placehold.co/1920x1080", alt: "Image 3" },
      { url: "https://placehold.co/1920x1080", alt: "Image 4" },
      { url: "https://placehold.co/1920x1080", alt: "Image 5" },
      { url: "https://placehold.co/1920x1080", alt: "Image 6" },
    ],
  },
} satisfies Meta<typeof GalleryModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: (props) => (
    <GalleryModal title="Gallery" images={props.images}>
      <div className="grid grid-cols-3 gap-4">
        {props.images?.map((image, index) => (
          <GalleryModalTrigger key={index} index={index} asChild>
            <img
              src={image?.url}
              alt={image?.alt}
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </GalleryModalTrigger>
        ))}
      </div>
    </GalleryModal>
  ),
} satisfies Story;
