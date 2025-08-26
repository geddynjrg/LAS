import type { BlockType } from '@/lib/api/types';
import { isBannerBlock, isTextBlocksContainer } from '@/lib/guards';
import type { FC } from 'react';

import { BannerBlockComponent, TextBlocksComponent } from './blocks';

export interface PageComponentRendererProps {
  component: BlockType;
  index: number;
  nodeId?: string;
}

export const PageComponentRenderer: FC<PageComponentRendererProps> = ({
  component,
  index,
  nodeId,
}) => {
  const key = `${nodeId}-${component.block_type}-${index}`;

  // Type-safe component rendering
  if (isBannerBlock(component)) {
    return <BannerBlockComponent key={key} data={component} />;
  }

  if (isTextBlocksContainer(component)) {
    return <TextBlocksComponent key={key} data={component} />;
  }

  // Fallback for unknown component types
  const unknownComponent = component as { block_type: string };
  console.warn(
    `Unknown component type: ${unknownComponent.block_type}`,
    component,
  );
  return (
    <div
      key={key}
      className="my-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4"
    >
      <p className="text-sm text-yellow-800">
        Unknown component type: <strong>{unknownComponent.block_type}</strong>
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-yellow-700">
          View raw data
        </summary>
        <pre className="mt-2 overflow-auto text-xs text-yellow-600">
          {JSON.stringify(component, null, 2)}
        </pre>
      </details>
    </div>
  );
};
