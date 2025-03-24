import type { Meta, StoryObj } from "@storybook/react";

import { VocationalCentersBlock } from "@workspace/ui/components/tvet/blocks/vocational-centers-block";

const meta = {
  component: VocationalCentersBlock,
  args: {
    block_type: "vocational_centres",
    institutions: [
      {
        id: "1",
        address: {
          address_line: "Address Line 1",
          administrative_area: "Administrative Area 1",
          locality: "Locality 1",
          dependent_locality: "Dependent Locality 1",
          postal_code: "Postal Code 1",
        },
        location: {
          latitude: 0,
          longitude: 0,
        },
        path_alias: "path-alias-1",
        title: "Title 1",
        url: "https://example.com",
      },
      {
        id: "2",
        address: {
          address_line: "Address Line 2",
          administrative_area: "Administrative Area 2",
          locality: "Locality 1",
          dependent_locality: "Dependent Locality 2",
          postal_code: "Postal Code 2",
        },
        location: {
          latitude: 0,
          longitude: 0,
        },
        path_alias: "path-alias-2",
        title: "Title 2",
        url: "https://example.com",
      },
      {
        id: "3",
        address: {
          address_line: "Address Line 3",
          administrative_area: "Administrative Area 3",
          locality: "Locality 2",
          dependent_locality: "Dependent Locality 3",
          postal_code: "Postal Code 3",
        },
        location: {
          latitude: 0,
          longitude: 0,
        },
        path_alias: "path-alias-3",
        title: "Title 3",
        url: "https://example.com",
      },
    ],
  },
} satisfies Meta<typeof VocationalCentersBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
