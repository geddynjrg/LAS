import type { FC, ReactNode } from "react";

import { ApplicationBlock } from "@/components/application-block";
import type { BlockType } from "@/lib/api/types";

export interface PageComponentsProps {
  components: BlockType[];
}

export const PageComponents: FC<PageComponentsProps> = ({ components }) => {
  return components.map((component) => {
    switch (component.block_type) {
      case "application":
        return <ApplicationBlock {...component} />;

      default:
        return <p> unknown {component.block_type}</p>;
    }
  });
};
