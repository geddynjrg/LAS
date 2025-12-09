import { Button } from '@workspace/ui/components/button';
import { Container } from '@workspace/ui/components/container';
import { IconCheck } from '@workspace/ui/components/icon-check';
import { cn } from '@workspace/ui/lib/utils';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { DonePageActions } from './done-page-actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();

  return (
    <Container
      className={cn('grow-1 flex flex-col items-center gap-3', 'mb-20 mt-7')}
    >
      <IconCheck className={cn('h-[4.75rem] w-[4.75rem]')} />

      <div className={cn('flex flex-col items-center gap-7', 'text-center')}>
        <h2 className={cn('typo-h2')}>{t('ApplyPage.DonePage.title')}</h2>

        <p>{t('ApplyPage.DonePage.application-received-message')}</p>

        <DonePageActions applicationId={id} />

        <p className={cn('border-t border-solid border-neutral-400', 'pt-7')}>
          {t('ApplyPage.DonePage.tracking-hint')}
        </p>

        <Button className={cn('w-full max-w-[27rem]')} asChild>
          <Link href="/dashboard">
            {t('ApplyPage.DonePage.go-to-applications')}
          </Link>
        </Button>
      </div>
    </Container>
  );
}
