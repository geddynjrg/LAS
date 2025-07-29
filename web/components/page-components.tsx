import type { FC } from "react";

import type { BlockType } from "@/lib/api/types";
import { PageComponentRenderer } from "./page-components-renderer";

export interface PageComponentsProps {
  node_id?: string;
  page_components?: BlockType[];
}

export const PageComponents: FC<PageComponentsProps> = ({
  node_id,
  page_components = [],
}) => {
  if (page_components.length === 0) {
    return null;
  }

  return (
    <>
      {page_components.map((component, index) => (
        <PageComponentRenderer
          key={`${node_id}-${component.block_type}-${index}`}
          component={component}
          index={index}
          nodeId={node_id}
        />
      ))}
    </>
  );
};
