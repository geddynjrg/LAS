import type { Meta, StoryObj } from "@storybook/react";
import { IconTimeline, IconTools } from "@tabler/icons-react";

import { IconBlock } from "@workspace/ui/components/icon-block";

/**
 * This component displays a block with an icon, title and children.
 */
const meta = {
  component: IconBlock,

  args: {
    title: "Lorem ipsum",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec hendrerit urna non est luctus, sit amet efficitur velit commodo.",
    icon: "R",
  },
} satisfies Meta<typeof IconBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const WithIcon = {
  args: {
    title: "Lorem ipsum",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec hendrerit urna non est luctus, sit amet efficitur velit commodo.",
    icon: "R",
  },
  render: (props) => (
    <div className="flex gap-4">
      <IconBlock {...props} icon={<IconTools />} />
      <IconBlock {...props} icon={<IconTimeline />} />
    </div>
  ),
} satisfies Story;
