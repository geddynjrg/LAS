import type { Meta, StoryObj } from "@storybook/react";

import { Loader } from "@workspace/ui/components/loader";

const meta = {
  component: Loader,
  args: {
    size: 130,
    animation: "subtle",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          color: "gray",
          fontSize: "14px",
        }}
      >
        <Story />
        <h4>
          <strong>HINT!</strong> With small Loader size use <u>strong</u>{" "}
          animation to amplify the animation-effect.
        </h4>
      </div>
    ),
  ],
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const SmallAndStrong = {
  render: () => <Loader animation="strong" size={16} />,
};
