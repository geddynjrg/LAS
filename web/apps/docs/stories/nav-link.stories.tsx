import type { Meta, StoryObj } from "@storybook/react";

import { NavLink } from "@workspace/ui/components/nav-link";

const meta = {
  component: NavLink,
  args: {
    href: "/",
    children: "NavLink",
  },
  argTypes: {
    href: {
      type: "string",
      description: "Link URL",
      control: { type: "text" },
    },
    children: {
      type: "string",
      description: "Link text",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof NavLink>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Next nav link component.
 * It uses the `usePathname` hook from `next/navigation` to determine if the link is active.
 */
export const Primary = {} satisfies Story;
