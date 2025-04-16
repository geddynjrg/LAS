"use client";

import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper, type Step } from "@workspace/ui/components/stepper";

const steps: Step[] = [
  { index: 1, title: "Applicant", path: "applicant" },
  { index: 2, title: "Guardian", path: "guardian" },
  { index: 3, title: "Course", path: "course" },
  { index: 4, title: "Confirmations", path: "confirmations" },
  { index: 5, title: "Payment", path: "payment" },
];

export interface ApplyFormStepperProps {
  activeStep: number;
}

export const ApplyFormStepper: FC<ApplyFormStepperProps> = ({ activeStep }) => {
  return (
    <Container className="mt-7 pr-0">
      <Stepper activeStep={activeStep} steps={steps} />
    </Container>
  );
};
