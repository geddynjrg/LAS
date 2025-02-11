import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";

const meta = {
  title: "collapsible",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>This is the collapsible content.</CollapsibleContent>
    </Collapsible>
  ),
} satisfies Story;

export const AsButton = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button>Toggle</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        This is the collapsible content.
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Story;
