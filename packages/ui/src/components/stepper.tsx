"use client";

import { useEffect, useRef, type FC, type ReactNode } from "react";

import { useMount } from "@workspace/ui/hooks/use-mount";
import { cn } from "@workspace/ui/lib/utils";

export interface StepperProps {
  steps: string[];
  activeStep: number;
  className?: string;
}

export const Stepper: FC<StepperProps> = ({ steps, activeStep, className }) => {
  const wrapRef = useRef<HTMLOListElement>(null);

  useMount(() => {
    handleScrollToActiveStep();
  });

  useEffect(() => {
    handleScrollToActiveStep();
  }, [activeStep]);

  const handleScrollToActiveStep = () => {
    wrapRef.current?.querySelector("[data-active=true]")?.scrollIntoView({
      behavior: "instant",
      inline: "start",
    });
  };

  return (
    <ol
      className={cn(
        "bg-background scrollbar-width-none flex flex-row overflow-x-auto",
        className,
      )}
      ref={wrapRef}
    >
      {steps.map((step, i) => (
        <Step stepNumber={i + 1} activeStep={activeStep} key={i}>
          {step}
        </Step>
      ))}
    </ol>
  );
};

interface StepProps {
  stepNumber: number;
  activeStep: number;
  children: ReactNode;
}

const Step: FC<StepProps> = ({ stepNumber, activeStep, children }) => {
  return (
    <li
      data-active={activeStep === stepNumber}
      className={cn(
        "group flex flex-row gap-2 whitespace-nowrap px-4 py-2 focus-visible:outline-none",
        activeStep > stepNumber &&
          "text-stepper-foreground bg-stepper hover:bg-stepper-hover active:bg-stepper-active focus-visible:ring-ring focus-visible:scale-y-85 focus:outline-none focus-visible:scale-x-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        activeStep === stepNumber &&
          "bg-primary text-primary-foreground clip-arrow-right pr-8 font-bold",
      )}
    >
      <StepNumber stepNumber={stepNumber} activeStep={activeStep} />
      {children}
    </li>
  );
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
        activeStep > stepNumber && "bg-primary group-active:bg-primary-hover",
        activeStep === stepNumber && "bg-primary-foreground text-primary",
      )}
    >
      {stepNumber}
    </span>
  );
};
