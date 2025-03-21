"use client";

import { usePathname } from "next/navigation";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper } from "@workspace/ui/components/stepper";

import type { ApplyStep } from "@/app/apply/[id]/layout";

export interface ApplyFormStepperProps {
  steps: ApplyStep[];
}

export const ApplyFormStepper: FC<ApplyFormStepperProps> = ({ steps }) => {
  const pathname = usePathname();

  const activeStep = steps.find((step) => pathname.includes(step.path))?.index;

  if (!activeStep) {
    return null;
  }

  return (
    <Container className="mt-7">
      <Stepper
        activeStep={activeStep}
        steps={steps.map((step) => step.title)}
      />
    </Container>
  );
};
