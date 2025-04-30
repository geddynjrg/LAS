import { notFound, redirect } from "next/navigation";

export const ALL_STEPS = [
  "applicant",
  "guardian",
  "course",
  "confirmation",
  "payment",
] as const;

export type ApplicationStep = (typeof ALL_STEPS)[number];

export interface ApplicationStepsInfo {
  application_id?: string;
  current_step?: ApplicationStep | null;
  step_links?: {
    [K in ApplicationStep]?: {
      completed?: boolean;
      available?: boolean;
    };
  };
}

export function ensureStepAvailable(
  currentStep: ApplicationStep,
  application?: ApplicationStepsInfo,
) {
  if (!application) {
    notFound();
  }

  const availableSteps = getAvailableSteps(application);

  // check if the current step is available
  if (availableSteps?.includes(currentStep)) {
    return true;
  }

  // find closest next step and redirect to it if available
  const nextStep = ALL_STEPS[ALL_STEPS.indexOf(currentStep) + 1];

  if (nextStep && availableSteps.includes(nextStep)) {
    redirect(`/apply/${application.application_id}/${nextStep}/`);
  }

  // if no next step is available, redirect to the last available step
  if (application.current_step) {
    redirect(
      `/apply/${application.application_id}/${application.current_step}/`,
    );
  }

  // if no steps are available, redirect to the first available step
  const firstAvailableStep = availableSteps?.[0] ?? "applicant";

  if (firstAvailableStep === currentStep) {
    notFound();
  }

  redirect(`/apply/${application.application_id}/${firstAvailableStep}/`);
}

export function getAvailableSteps(application?: ApplicationStepsInfo) {
  return Object.entries(application?.step_links ?? []).map(
    ([step]) => step,
  ) as ApplicationStep[];
}

export function getPrevStep(
  step: ApplicationStep,
  application?: ApplicationStepsInfo,
) {
  const availableSteps = getAvailableSteps(application);
  const currentStepIndex = availableSteps.indexOf(step);
  const prevStepIndex = currentStepIndex - 1;

  if (prevStepIndex < 0) {
    return undefined;
  }

  return availableSteps[prevStepIndex];
}
