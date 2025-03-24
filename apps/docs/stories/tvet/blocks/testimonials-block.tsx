import type { Meta, StoryObj } from "@storybook/react";

import { TestimonialsBlock } from "@workspace/ui/components/tvet/blocks/testimonials-block";

const meta = {
  component: TestimonialsBlock,
  args: {
    block_type: "testimonials",
    testimonials: [
      {
        block_type: "testimonial",
        name: "John Doe",
        short_description: {
          value: "I am a student at Nairobi VTC and I am loving it!",
          format: "full_html",
          processed: "I am a student at Nairobi VTC and I am loving it!",
        },
        image: [
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
      {
        block_type: "testimonial",
        name: "Jane Doe",
        short_description: {
          value: "I am a student at Nairobi VTC and I am loving it!",
          format: "full_html",
          processed: "I am a student at Nairobi VTC and I am loving it!",
        },
        image: [
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
    ],
  },
} satisfies Meta<typeof TestimonialsBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
