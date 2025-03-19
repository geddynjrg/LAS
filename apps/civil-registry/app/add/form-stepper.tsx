"use client";

import { usePathname } from "next/navigation";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper } from "@workspace/ui/components/stepper";

import type { Step } from "@/app/add/layout";

export interface FormStepperProps {
  steps: Step[];
}

export const FormStepper: FC<FormStepperProps> = ({ steps }) => {
  const pathname = usePathname();

  const activeStep =
    steps.find((step) => pathname.includes(step.path))?.index ?? 1;

  return (
    <Container className="mt-7 pr-0">
      <Stepper
        activeStep={activeStep}
        steps={steps.map((step) => step.title)}
      />
    </Container>
  );
};
