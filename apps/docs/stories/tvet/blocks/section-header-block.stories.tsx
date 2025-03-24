import type { Meta, StoryObj } from "@storybook/react";

import { SectionHeaderBlock } from "@workspace/ui/components/tvet/blocks/section-header-block";

const meta = {
  component: SectionHeaderBlock,
  args: {
    block_type: "section_heading",
    title: "Section Header",
    description: {
      value: "Description",
      format: "full_html",
      processed: "Description",
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
} satisfies Meta<typeof SectionHeaderBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
