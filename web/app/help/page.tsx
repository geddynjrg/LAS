import type { SiteInformationResponse } from '@/lib/api/schema/site-info/site-info.schema';
import { getSiteInfo } from '@/lib/api/site-info';
import { IconHelp, IconMail, IconMapPin, IconPhone } from '@tabler/icons-react';
import { Card } from '@workspace/ui/components/card';
import { Container } from '@workspace/ui/components/container';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

const SECTIONS = [
  'gettingStarted',
  'applicationProcess',
  'memberConfirmation',
  'statusUpdates',
  'repayment',
  'faq',
  'contact',
] as const;

export default async function HelpPage() {
  const t = await getTranslations('HelpPage');

  let siteInfo: SiteInformationResponse | null = null;
  try {
    siteInfo = await getSiteInfo();
  } catch {
    siteInfo = null;
  }

  const contact = siteInfo?.data?.site?.contact;

  return (
    <Container className="py-8">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconHelp size={28} />
        </div>
        <div>
          <h1 className="typo-h1">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">{t('intro')}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav
          aria-label={t('title')}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <Card variant="success" className="divide-y divide-neutral-200 p-2">
            {SECTIONS.map((section) => (
              <Link
                key={section}
                href={`#${section}`}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary"
              >
                {t(`nav.${section}`)}
              </Link>
            ))}
          </Card>
        </nav>

        <div className="space-y-6">
          <HelpSection
            id="gettingStarted"
            title={t('sections.gettingStarted.title')}
          >
            <p>{t('sections.gettingStarted.description')}</p>
            <p className="mt-3">{t('sections.gettingStarted.apply')}</p>
            <p className="mt-3">
              <Link href="/#criteria" className="text-primary underline">
                {t('sections.gettingStarted.link')}
              </Link>
            </p>
          </HelpSection>

          <HelpSection
            id="applicationProcess"
            title={t('sections.applicationProcess.title')}
          >
            <p>{t('sections.applicationProcess.description')}</p>
            <p className="mt-3 font-medium">
              {t('sections.applicationProcess.steps')}
            </p>
          </HelpSection>

          <HelpSection
            id="memberConfirmation"
            title={t('sections.memberConfirmation.title')}
          >
            <p>{t('sections.memberConfirmation.description')}</p>
          </HelpSection>

          <HelpSection
            id="statusUpdates"
            title={t('sections.statusUpdates.title')}
          >
            <p>{t('sections.statusUpdates.description')}</p>
            <p className="mt-3">
              <Link href="/dashboard" className="text-primary underline">
                {t('nav.statusUpdates')}
              </Link>
            </p>
          </HelpSection>

          <HelpSection id="repayment" title={t('sections.repayment.title')}>
            <p>{t('sections.repayment.description')}</p>
          </HelpSection>

          <HelpSection id="faq" title={t('sections.faq.title')}>
            <dl className="space-y-4">
              <div>
                <dt className="font-semibold text-neutral-900">
                  {t('sections.faq.q1')}
                </dt>
                <dd className="mt-1 text-neutral-600">
                  {t('sections.faq.a1')}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">
                  {t('sections.faq.q2')}
                </dt>
                <dd className="mt-1 text-neutral-600">
                  {t('sections.faq.a2')}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">
                  {t('sections.faq.q3')}
                </dt>
                <dd className="mt-1 text-neutral-600">
                  {t('sections.faq.a3')}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-neutral-900">
                  {t('sections.faq.q4')}
                </dt>
                <dd className="mt-1 text-neutral-600">
                  {t('sections.faq.a4')}
                </dd>
              </div>
            </dl>
          </HelpSection>

          <HelpSection id="contact" title={t('sections.contact.title')}>
            <p>{t('sections.contact.description')}</p>
            {contact ? (
              <ul className="mt-4 space-y-3">
                {contact.email && (
                  <li className="flex items-center gap-2">
                    <IconMail size={18} className="text-primary" />
                    <span className="font-medium">
                      {t('sections.contact.email')}:
                    </span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary underline"
                    >
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-2">
                    <IconPhone size={18} className="text-primary" />
                    <span className="font-medium">
                      {t('sections.contact.phone')}:
                    </span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary underline"
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.address && (
                  <li className="flex items-start gap-2">
                    <IconMapPin size={18} className="mt-0.5 text-primary" />
                    <span>
                      <span className="font-medium">
                        {t('sections.contact.address')}:
                      </span>{' '}
                      {contact.address}
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-3 text-neutral-500">
                {t('sections.contact.description')}
              </p>
            )}
          </HelpSection>
        </div>
      </div>
    </Container>
  );
}

function HelpSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <Card variant="success" className="p-6">
        <h2 className="typo-h3 mb-4 text-neutral-900">{title}</h2>
        <div className="text-neutral-700">{children}</div>
      </Card>
    </div>
  );
}
