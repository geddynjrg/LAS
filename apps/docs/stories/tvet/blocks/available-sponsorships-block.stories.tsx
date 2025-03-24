import type { Meta, StoryObj } from "@storybook/react";

import { AvailableSponsorshipsBlock } from "@workspace/ui/components/tvet/blocks/available-sponsorships-block";

const meta = {
  component: AvailableSponsorshipsBlock,
  args: {
    block_type: "available_sponsorships",
    sponsorships: [
      {
        title: "Sponsorship Title",
        description: {
          value: "Sponsorship Description",
          format: "full_html",
          processed: "Sponsorship Description",
        },
        id: "sponsorship-id",
        link: [
          {
            title: "Sponsorship Link Title",
            url: "https://sponsorship-link.com",
            is_external: false,
          },
        ],
        application_form: {
          id: "application-form-id",
          type: "application-form",
          bundle: "application-form",
          name: "Application Form",
          uuid: "application-form-uuid",
          url: "https://application-form.com",
          mime_type: "application/pdf",
          size: 1000,
        },
      },
      {
        title: "Sponsorship Title",
        description: {
          value: "Sponsorship Description",
          format: "full_html",
          processed: "Sponsorship Description",
        },
        id: "sponsorship-id",
        link: [
          {
            title: "Sponsorship Link Title",
            url: "https://sponsorship-link.com",
            is_external: false,
          },
        ],
        application_form: {
          id: "application-form-id",
          type: "application-form",
          bundle: "application-form",
          name: "Application Form",
          uuid: "application-form-uuid",
          url: "https://application-form.com",
          mime_type: "application/pdf",
          size: 1000,
        },
      },
    ],
  },
} satisfies Meta<typeof AvailableSponsorshipsBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
