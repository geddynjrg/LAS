'use client';

import {
  type StepGuidance,
  getStepGuidance,
  guidanceKeyFromPathname,
} from '@/lib/application-guidance';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

export const ApplicationGuidancePanel: FC<{
  guidance?: StepGuidance | null;
}> = ({ guidance: guidanceProp }) => {
  const t = useTranslations('ApplicationGuidance');
  const pathname = usePathname();
  const guidance =
    guidanceProp !== undefined
      ? guidanceProp
      : getStepGuidance(guidanceKeyFromPathname(pathname ?? ''));

  if (!guidance) {
    return null;
  }

  return (
    <aside
      aria-label={t('ariaLabel')}
      className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
    >
      <p className="font-semibold">{t('title', { step: guidance.title })}</p>
      <p className="mt-1 text-xs text-sky-800">{t('subtitle')}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
            {t('prepareHeading')}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {guidance.prepare.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
            {t('mistakesHeading')}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {guidance.commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export { ApplicationGuidancePanel as ApplicationGuidance };
