"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "cva-extended";
import type { FC, ReactNode, Ref } from "react";

import { cn } from "@workspace/ui/lib/utils";

export const labelVariants = cva({
  base: "text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
});

export interface LabelProps extends VariantProps<typeof labelVariants> {
  className?: string;
  htmlFor?: string;
  children?: ReactNode;
  ref?: Ref<HTMLLabelElement>;
}

export const Label: FC<LabelProps> = ({ className, ...props }) => (
  <LabelPrimitive.Root className={cn(labelVariants(), className)} {...props} />
);
