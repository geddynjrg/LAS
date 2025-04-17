import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import { HeroSection } from "@workspace/ui/components/tvet/hero-section";

const meta = {
  component: HeroSection,
  title: "TVET/Hero Section",
  args: {
    title: "Hero Section",
    backgroundUrl:
      "https://images.unsplash.com/photo-1521747116042-5a810fda9664?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGhvbGUlMjBpbWFnZXxlbnwwfHx8fDE2OTk1NzE0NTM&ixlib=rb-4.0.3&q=80&w=1080",
    backgroundAlt: "Hero Background",
    actions: (
      <>
        <Button>Action</Button>
      </>
    ),
    children: <p>Children</p>,
  },
} satisfies Meta<typeof HeroSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
