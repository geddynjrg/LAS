'use client';

import { Container } from '@workspace/ui/components/container';
import { type Step, Stepper } from '@workspace/ui/components/stepper';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

export interface ApplyFormStepperProps {
  steps: Step[];
  applicationProgress: number;
  baseUrl: string;
}

export const ApplyFormStepper: FC<ApplyFormStepperProps> = ({
  steps,
  applicationProgress,
  baseUrl,
}) => {
  const pathname = usePathname();

  const activeStep = steps.find((step) =>
    pathname.includes(step.path ?? ''),
  )?.index;

  if (!activeStep) {
    return null;
  }

  return (
    <Container className="mt-7">
      <Stepper
        activeStep={activeStep}
        steps={steps}
        progress={applicationProgress}
        baseUrl={baseUrl}
      />
    </Container>
  );
};
