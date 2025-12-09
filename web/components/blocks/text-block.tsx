import type { TextBlocksContainer } from '@/lib/api/schema';
import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/uwezo/card';
import Link from 'next/link';
import type { FC } from 'react';

export interface TextBlockCardProps {
  block: TextBlocksContainer['blocks'][0];
}

export const TextBlockCard: FC<TextBlockCardProps> = ({ block }) => {
  return (
    <Card radius="lg" variant="primary" className="flex flex-col">
      {/* Text content */}
      <div
        className="flex-1"
        dangerouslySetInnerHTML={{
          __html: block.text.processed || block.text.value || '',
        }}
      />

      {/* Buttons if available */}
      {block.button && block.button.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {block.button.map((btn, index) => (
            <Button key={index} variant="secondary" size="sm" asChild>
              {btn.is_external ? (
                <a href={btn.url} target="_blank" rel="noopener noreferrer">
                  {btn.title}
                </a>
              ) : (
                <Link href={btn.url}>{btn.title}</Link>
              )}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};
