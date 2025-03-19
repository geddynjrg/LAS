"use client";

import type { FC, ReactNode } from "react";

import { Slot } from "@workspace/ui/components/slot";

export interface ScrollToProps {
  targetId: string;
  children?: ReactNode;
}

export const ScrollTo: FC<ScrollToProps> = ({ targetId, children }) => {
  return (
    <Slot
      onClick={() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    >
      {children}
    </Slot>
  );
};
