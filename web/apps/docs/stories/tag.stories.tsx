import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "@workspace/ui/components/tag";

/**
 * This component displays a tag.
 * Tag's text and border color is inherited from the parent component.
 */

const meta = {
  component: Tag,

  args: {
    children: "Tag",
  },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const Removeable = {
  args: {
    children: "Tag",
    onRemove: () => {
      alert("Tag removal called");
    },
  },
} satisfies Story;

/**
 * darker background inherits lighter text color to see the tag
 */
export const DarkerBackground = {
  args: {
    children: "Tag",
  },
  render: (props) => (
    <>
      <div className="p-8">
        <Tag {...props} />
        <p>regular text</p>
      </div>
      <div className="text-primary-foreground bg-primary p-8">
        <Tag {...props} />
        <p>Colored background, lighter text</p>
      </div>
    </>
  ),
} satisfies Story;
