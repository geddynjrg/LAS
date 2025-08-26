import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { FC } from 'react';

export const ApplyButton: FC<{
  className?: string;
  href?: string | undefined;
  title?: string | undefined;
}> = async ({ className, href, title }) => {
  const t = await getTranslations('FrontPage');

  return (
    <Button
      asChild
      variant="secondary"
      className={cn(
        'bg-background text-primary hover:text-background border-primary px-6',
        className,
      )}
    >
      <Link href={href ?? '/apply'}>{title ?? t('startApplying')}</Link>
    </Button>
  );
};
