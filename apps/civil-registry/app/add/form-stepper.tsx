"use client";

import { usePathname } from "next/navigation";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper, type Step } from "@workspace/ui/components/stepper";

export interface FormStepperProps {
  steps: Step[];
  progress: number;
}

export const FormStepper: FC<FormStepperProps> = ({ steps, progress }) => {
  const pathname = usePathname();

  const activeStep = steps.find((step) => pathname.includes(step.path))?.index;

  if (!activeStep) {
    return null;
  }

  return (
    <Container className="mt-7 pr-0">
      <Stepper
        activeStep={activeStep}
        steps={steps}
        baseUrl="/add"
        progress={progress}
      />
    </Container>
  );
};
