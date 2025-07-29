import type { Meta, StoryObj } from "@storybook/react";
import { IconId, IconPrinter } from "@tabler/icons-react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  cardVariants,
  PersonCardLink,
} from "@workspace/ui/components/card";
import { DataNode } from "@workspace/ui/components/data-node";
import { cn } from "@workspace/ui/lib/utils";

const meta = {
  component: Card,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: cardVariants.variants.variant,
    },
  },
  args: {
    variant: "danger",
    statusLabel: "Status label text",
    caption: "Caption placeholder text",
    title: "Card Title",
    children: (
      <div
        className={cn(
          "flex justify-between",
          "px-4",
          "sm:gap-8 sm:self-center",
          "md:gap-0 md:self-auto",
        )}
      >
        <DataNode label="Data label 1">Data 1</DataNode>
        <DataNode label="Data label 2">Data 2</DataNode>
      </div>
    ),
    footer: (
      <Button asChild>
        <a href="#">Some content</a>
      </Button>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Danger = {} satisfies Story;

export const Success = {
  args: {
    variant: "success",
    statusLabel: "Status label text",
    caption: "Caption placeholder text",
    title: "Card Title",
    children: (
      <div
        className={cn(
          "flex justify-between",
          "px-4",
          "sm:gap-8 sm:self-center",
          "md:gap-0 md:self-auto",
        )}
      >
        <DataNode label="Data label 1">Data 1</DataNode>
        <DataNode label="Data label 2">Data 2</DataNode>
      </div>
    ),
    footer: (
      <div className="flex flex-col items-center gap-1">
        <PersonCardLink>
          <IconPrinter /> Link text
        </PersonCardLink>
        <PersonCardLink>
          <IconId /> Link text 2
        </PersonCardLink>
      </div>
    ),
  },
} satisfies Story;

export const Warning = {
  args: {
    variant: "warning",
    statusLabel: "Status label text",
    caption: "Caption placeholder text",
    title: "Card Title",
    children: (
      <div
        className={cn(
          "flex justify-between",
          "px-4",
          "sm:gap-8 sm:self-center",
          "md:gap-0 md:self-auto",
        )}
      >
        <DataNode label="Data label 1">Data 1</DataNode>
        <DataNode label="Data label 2">Data 2</DataNode>
      </div>
    ),
    footer: (
      <Button asChild>
        <a href="#">Some content</a>
      </Button>
    ),
  },
} satisfies Story;
