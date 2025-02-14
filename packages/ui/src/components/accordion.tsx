"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { IconChevronDown } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export interface AccordionProps {
  value: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}

export const AccordionItem: FC<AccordionProps> = ({ className, ...props }) => (
  <AccordionPrimitive.Item
    className={cn(
      "data-[state=open]:border-primary data-disabled:border-neutral-500 overflow-hidden rounded-md border border-neutral-500",
      className,
    )}
    {...props}
  />
);

interface AccordionTriggerProps {
  className?: string;
  children: ReactNode;
}

export const AccordionTrigger: FC<AccordionTriggerProps> = ({
  className,
  children,
}) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      className={cn(
        "typo-h6 flex flex-1 items-center gap-2.5 px-6 py-4 text-neutral-700 transition-all [&[data-state=open]>svg]:rotate-180",
        "hover:text-foreground hover:bg-neutral-200", // hover
        "active:bg-neutral-300", // active
        "data-[state=open]:bg-accordion", // open
        "data-disabled:text-neutral-400", // disabled
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-offset-2 data-[state=closed]:focus-visible:ring-2", // focus
        className,
      )}
    >
      <IconChevronDown
        size={24}
        className="transition-transform duration-200"
      />
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

interface AccordionContentProps {
  className?: string;
  children: ReactNode;
}

export const AccordionContent: FC<AccordionContentProps> = ({
  className,
  children,
}) => (
  <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
    <div className={cn("p-4", className)}>{children}</div>
  </AccordionPrimitive.Content>
);
