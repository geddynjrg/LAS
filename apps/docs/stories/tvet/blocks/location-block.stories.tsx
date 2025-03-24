import type { Meta, StoryObj } from "@storybook/react";

import { LocationBlock } from "@workspace/ui/components/tvet/blocks/location-block";

const meta = {
  component: LocationBlock,
  args: {
    block_type: "location",
    address: {
      address_line: "123 Main St",
      administrative_area: "Nairobi",
      country_code: "KE",
      locality: "Nairobi",
      organization: "Organization",
      postal_code: "12345",
      dependent_locality: "Dependent Locality",
    },
    hint: "123 Main St, Nairobi, Nairobi, KE",
    image: [
      {
        alt: "Image Alt",
        bundle: "image",
        height: "400",
        id: "1",
        mime_type: "image/jpeg",
        name: "image.jpg",
        size: 400,
        title: "Image Title",
        type: "image",
        url: "https://placehold.co/640x480",
        uuid: "1",
        width: "400",
      },
    ],
    show_directions: true,
    show_map: true,
    location: {
      latitude: 0,
      longitude: 0,
    },
  },
} satisfies Meta<typeof LocationBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
