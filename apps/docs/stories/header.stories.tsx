import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "@workspace/ui/components/header";

const meta = {
  component: Header,
  args: {
    startDecorator: <div className="flex items-center">startDecorator</div>,
    endDecorator: <div className="flex items-center">endDecorator</div>,
    children: <div className="flex items-center">children</div>,
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="[--header-height:4.5rem] md:[--header-height:5.5rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const FloatingInMobile = {
  args: {
    isFloating: "mobile-only",
  },
  render: (args) => (
    <>
      <Header {...args} />
      <img
        src="https://placehold.co/600x400"
        alt="placeholder"
        width={600}
        height={400}
        className="mx-auto"
      />
      <div className="p-4">
        <p className="mt-4">
          Resize the screen to see Header component change.
        </p>
        <p className="mt-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec
          odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla
          quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent
          mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Lorem
          ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio.
          Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis
          sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.
          Fusce nec tellus sed augue semper porta. Mauris massa. Mauris massa.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec
          odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla
          quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent
          mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Mauris
          massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed
          nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.
          Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris
          massa.
        </p>
      </div>
    </>
  ),
} satisfies Story;
