"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { IconChevronDown } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const PersonAccordion = AccordionPrimitive.Root;

export interface PersonAccordionItemProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export const PersonAccordionItem: FC<PersonAccordionItemProps> = ({
  className,
  ...props
}) => (
  <AccordionPrimitive.Item
    className={cn(
      "overflow-hidden rounded-2xl border border-neutral-400 bg-neutral-200 p-4",
      className,
    )}
    {...props}
  />
);

interface PersonAccordionTriggerProps {
  className?: string;
  children: ReactNode;
}

export const PersonAccordionTrigger: FC<PersonAccordionTriggerProps> = ({
  className,
  children,
}) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      className={cn(
        "typo-h6 flex flex-1 items-center justify-between text-neutral-700 transition-all [&[data-state=open]>svg]:rotate-180",
        "hover:text-foreground", // hover
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-offset-2 data-[state=closed]:focus-visible:ring-2", // focus
        className,
      )}
    >
      {children}
      <IconChevronDown
        size={24}
        className="transition-transform duration-200"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

interface PersonAccordionContentProps {
  className?: string;
  children: ReactNode;
}

export const PersonAccordionContent: FC<PersonAccordionContentProps> = ({
  className,
  children,
}) => (
  <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
    <div className={cn("pt-3", className)}>{children}</div>
  </AccordionPrimitive.Content>
);
