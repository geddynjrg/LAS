import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Stepper, type Step } from "@workspace/ui/components/stepper";

import {
  ALL_STEPS,
  type ApplicationStep,
  type ApplicationStepsInfo,
} from "@/app/apply/[id]/stepper-utils";

export interface ApplyFormStepperProps {
  activeStep: ApplicationStep;
  application?: ApplicationStepsInfo;
}

export const ApplyFormStepper: FC<ApplyFormStepperProps> = async ({
  application,
  activeStep,
}) => {
  const t = await getTranslations("ApplyFormSteps");

  const steps: Step[] = ALL_STEPS.map((path, index) => ({
    index: index + 1,
    title: t(path),
    path,
  }));

  const activeStepIndex =
    steps.find((step) => step.path === activeStep)?.index ?? 1;

  const progressIndex =
    steps.find((step) => step.path === application?.current_step)?.index ?? 1;

  return (
    <Container className="mt-7 pr-0">
      <Stepper
        baseUrl={
          application?.application_id
            ? `/apply/${application?.application_id}`
            : undefined
        }
        activeStep={activeStepIndex}
        progress={progressIndex}
        steps={steps}
      />
    </Container>
  );
};
