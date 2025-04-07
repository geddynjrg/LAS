"use client";

import { usePathname } from "next/navigation";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper, type Step } from "@workspace/ui/components/stepper";

export interface ApplyFormStepperProps {
  steps: Step[];
}

export const ApplyFormStepper: FC<ApplyFormStepperProps> = ({ steps }) => {
  const pathname = usePathname();

  const activeStep =
    steps.find((step) => pathname.includes(step.path))?.index ?? 1;

  return (
    <Container className="mt-7 pr-0">
      <Stepper activeStep={activeStep} steps={steps} />
    </Container>
  );
};
