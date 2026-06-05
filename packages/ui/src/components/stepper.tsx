"use client";

import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useRef,
  type FC,
  type ReactNode,
} from "react";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
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

  const scrollActiveStepInNav = useCallback(() => {
    const nav = wrapRef.current;
    if (!nav) {
      return;
    }

    const target = nav.querySelector(
      isMobile ? "[data-active=true]" : "[data-before-active=true]",
    ) as HTMLElement | null;
    if (!target) {
      return;
    }

    // Scroll only the horizontal stepper nav — never the document (avoids mobile jump-to-top).
    const navRect = nav.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    nav.scrollLeft += targetRect.left - navRect.left;
  }, [isMobile]);

  useEffect(() => {
    scrollActiveStepInNav();
  }, [activeStep, scrollActiveStepInNav]);

  useEffect(() => {
    window.addEventListener("resize", scrollActiveStepInNav, { passive: true });
    return () =>
      window.removeEventListener("resize", scrollActiveStepInNav);
  }, [scrollActiveStepInNav]);

  return (
    <nav
      aria-label="Application form progress"
      ref={wrapRef}
      className={cn("scrollbar-width-none flex flex-row overflow-x-auto")}
    >
      <ol
        className={cn(
          "bg-background flex flex-row max-md:mr-[100vw]",
          className,
        )}
        role="list"
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
    </nav>
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

  const isClickable = step.path &&
    baseUrl &&
    progress &&
    step.index <= progress &&
    activeStep !== step.index;

  const handleClick = () => {
    if (isClickable) {
      router.push(`${baseUrl}/${step.path}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

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
        isClickable ? "cursor-pointer" : "cursor-default",
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : -1}
      role={isClickable ? "button" : "listitem"}
      aria-current={activeStep === step.index ? "step" : undefined}
      aria-label={`Step ${step.index}: ${children}${
        activeStep === step.index ? " (current)" : ""
      }${isClickable ? " - Click to navigate" : ""}`}
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
