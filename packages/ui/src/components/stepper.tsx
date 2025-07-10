"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type FC, type ReactNode } from "react";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { useMount } from "@workspace/ui/hooks/use-mount";
import { cn } from "@workspace/ui/lib/utils";

export interface StepperProps {
  steps: Step[];
  activeStep: number;
  className?: string;
  progress?: number;
  baseUrl?: string;
}

export interface Step {
  index: number;
  title: string;
  path?: string;
}

export const Stepper: FC<StepperProps> = ({
  steps,
  activeStep,
  className,
  baseUrl,
  progress,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();

  useMount(() => {
    handleScrollToActiveStep();
    window.addEventListener("resize", handleScrollToActiveStep, {
      passive: true,
    });
  });

  useEffect(() => {
    handleScrollToActiveStep();
  });

  const handleScrollToActiveStep = () => {
    wrapRef.current
      ?.querySelector(
        isMobile ? "[data-active=true]" : "[data-before-active=true]",
      )
      ?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
        inline: "start",
      });
  };

  return (
    <div
      ref={wrapRef}
      className={cn("scrollbar-width-none flex flex-row overflow-x-auto")}
    >
      <ol
        className={cn(
          "bg-background flex flex-row max-md:mr-[100vw]",
          className,
        )}
      >
        {steps.map((step, i) => (
          <Step
            step={step}
            activeStep={activeStep}
            lastStepNumber={steps.length}
            key={i}
            progress={progress}
            baseUrl={baseUrl}
          >
            {step.title}
          </Step>
        ))}
      </ol>
    </div>
  );
};

interface StepProps {
  step: Step;
  activeStep: number;
  lastStepNumber: number;
  progress?: number;
  baseUrl?: string;
  children: ReactNode;
}

const Step: FC<StepProps> = ({
  step,
  activeStep,
  lastStepNumber,
  progress,
  baseUrl,
  children,
}) => {
  const router = useRouter();

  return (
    <li
      data-before-active={handleDataBeforeActive(
        activeStep,
        step.index,
        lastStepNumber,
      )}
      data-active={activeStep === step.index}
      className={cn(
        "group flex select-none flex-row gap-2 whitespace-nowrap px-4 py-2 first:rounded-l-sm focus-visible:outline-none",
        activeStep > step.index &&
          "text-stepper-foreground bg-stepper hover:bg-stepper-hover active:bg-stepper-active focus-visible:ring-ring focus-visible:scale-y-85 focus:outline-none focus-visible:scale-x-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        activeStep === step.index &&
          "bg-stepper-primary text-primary-foreground clip-arrow-right pr-8 font-bold",
      )}
      onClick={() => {
        // allow stepper navigation if baseUrl and progress is present. Allows navigation back to previous steps and to currently in progress step
        if (
          step.path &&
          baseUrl &&
          progress &&
          step.index <= progress &&
          activeStep !== step.index
        ) {
          // Send to step path
          router.push(`${baseUrl}/${step.path}`);
        }
      }}
    >
      <StepNumber stepNumber={step.index} activeStep={activeStep} />
      {children}
    </li>
  );
};

const handleDataBeforeActive = (
  activeStep: number,
  stepNumber: number,
  lastStepNumber: number,
) => {
  if (activeStep === 1 && stepNumber === 1) {
    return true;
  }

  if (activeStep === lastStepNumber && activeStep === stepNumber) {
    return true;
  }

  return activeStep - 1 === stepNumber && activeStep !== lastStepNumber;
};

const StepNumber: FC<{ activeStep: number; stepNumber: number }> = ({
  activeStep,
  stepNumber,
}) => {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-white",
        activeStep < stepNumber && "bg-neutral-200 text-neutral-700",
        activeStep > stepNumber &&
          "bg-stepper-primary group-active:bg-primary-hover",
        activeStep === stepNumber &&
          "bg-primary-foreground text-stepper-primary",
      )}
    >
      {stepNumber}
    </span>
  );
};
