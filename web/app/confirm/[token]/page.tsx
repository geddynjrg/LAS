import { Card } from '@workspace/ui/components/card';
import { Container } from '@workspace/ui/components/container';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { ConfirmationPageClient } from './confirmation-page-client';

interface ConfirmationPageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { token } = await params;
  const t = await getTranslations('ConfirmationPage');

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-2xl">
        <Card variant="success" className="p-6">
          <div className="mb-6 text-center">
            <h1 className="typo-h1 mb-2">{t('title')}</h1>
            <p className="text-neutral-600">{t('description')}</p>
          </div>

          <Suspense fallback={<ConfirmationPageLoader />}>
            <ConfirmationPageClient token={token} />
          </Suspense>
        </Card>
      </div>
    </Container>
  );
}

// Loading component similar to admin queue page
function ConfirmationPageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="border-t-primary mx-auto h-10 w-10 animate-spin rounded-full border-4 border-neutral-200"></div>
        <p className="mt-4 text-sm text-neutral-500">
          Validating confirmation token...
        </p>
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata() {
  const t = await getTranslations('ConfirmationPage');

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}
