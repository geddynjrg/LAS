'use client';

import { steps } from '@/lib/constants';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { ActionBar } from '@workspace/ui/components/action-bar';
import { Button } from '@workspace/ui/components/button';
import { SubmitButton } from '@workspace/ui/components/form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

interface ApplyFormActionBarProps {
  disabled?: boolean;
  nextUrl?: string;
  prevUrl?: string;
  onBack?: () => void;
  hideNext?: boolean;
  className?: string;
  nextTooltip?: string;
}

export const ApplyFormActionBar: FC<ApplyFormActionBarProps> = ({
  disabled,
  nextUrl,
  prevUrl,
  hideNext,
  onBack,
  className,
  nextTooltip
}) => {
  const pathName = usePathname();
  const t = useTranslations();

  const activeStep =
    steps.find((step) => pathName.includes(step.path ?? ''))?.index ?? 1;

  const NextButtonContent = () => (
    <div className="flex flex-row gap-1">
      {activeStep === 6 ? t('Common.submit') : t('Common.next')}
      <IconArrowRight />
    </div>
  );

  return (
    <ActionBar className={cn('mt-8', className)}>
      <div className="mx-auto flex flex-row items-center gap-4">
        {/* Back Button */}
        <Button variant="secondary" asChild onClick={onBack} type="button">
          {onBack && !prevUrl ? (
            <div>
              <IconArrowLeft />
              {t('Common.back')}
            </div>
          ) : (
            <Link href={prevUrl || '#'}>
              <IconArrowLeft />
              {t('Common.back')}
            </Link>
          )}
        </Button>

        {/* Next/Submit Button with Tooltip Container */}
        {!hideNext && (
          <div className="relative group">
            {activeStep === 6 && nextUrl ? (
              <Button disabled={disabled}>
                <Link
                  href={nextUrl}
                  className={cn(
                    'text-background flex flex-row gap-1',
                    disabled && 'text-neutral-400',
                  )}
                >
                  <NextButtonContent />
                </Link>
              </Button>
            ) : (
              <SubmitButton disabled={disabled}>
                <NextButtonContent />
              </SubmitButton>
            )}

            {/* Tooltip that shows on hover when disabled */}
            {disabled && nextTooltip && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded py-2 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                {nextTooltip}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </ActionBar>
  );
};