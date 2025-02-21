import type { Meta, StoryObj } from "@storybook/react";
import { IconId, IconPrinter } from "@tabler/icons-react";

import { Button } from "@workspace/ui/components/button";
import { PersonCardLink } from "@workspace/ui/components/card";
import { PersonCard } from "@workspace/ui/components/civil-registry/person-card";
import { DataNode } from "@workspace/ui/components/data-node";
import { cn } from "@workspace/ui/lib/utils";

const meta = {
  component: PersonCard,
  args: {
    person: {
      id: "1",
      name: "John Rambo",
      age: "42 years",
      dob: "10.12.1982",
      sex: "M",
      validationStatus: "alert",
    },
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
} satisfies Meta<typeof PersonCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Alert = {} satisfies Story;

export const Success = {
  args: {
    person: {
      id: "1",
      name: "John Rambo",
      age: "42 years",
      dob: "10.12.1982",
      sex: "M",
      validationStatus: "success",
    },
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

export const Pending = {
  args: {
    variant: "warning",
    statusLabel: "Status label text",
    caption: "Caption placeholder text",
    title: "Card Title",
    person: {
      id: "1",
      name: "John Rambo",
      age: "42 years",
      dob: "10.12.1982",
      sex: "M",
      validationStatus: "pending",
    },
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
