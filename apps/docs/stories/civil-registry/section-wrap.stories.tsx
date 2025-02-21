import type { Meta, StoryObj } from "@storybook/react";

import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";

const meta = {
  component: SectionWrap,
  args: {
    children:
      "SectionWrap uses a global Container wrap inside with a purpose to unify a max-width for all views. The purpose of this sub-component is to extend the Container by adding the ability to unify side paddings across local views. Top and bottom paddings are optional to allow more flexibility in usage.",
    hasBottomPadding: true,
    hasTopPadding: true,
    className: "bg-neutral-100",
  },
} satisfies Meta<typeof SectionWrap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
