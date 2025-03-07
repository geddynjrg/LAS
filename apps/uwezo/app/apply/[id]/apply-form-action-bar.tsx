"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";

import type { ApplyStep } from "@/app/apply/[id]/layout";

export interface ApplyFormActionBarProps {
  steps: ApplyStep[];
}

export const ApplyFormActionBar: FC<ApplyFormActionBarProps> = ({ steps }) => {
  const pathName = usePathname();

  const activeStep =
    steps.find((step) => pathName.includes(step.path))?.index ?? 1;
  const prevHref =
    steps.find((step) => step.index === activeStep - 1)?.path ?? "/apply";
  const nextHref =
    steps.find((step) => step.index === activeStep + 1)?.path ?? "#"; // else goes to done view

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild>
          <Link href={prevHref}>
            <IconArrowLeft />
            Back
          </Link>
        </Button>
        <Button asChild>
          <Link href={nextHref}>
            {activeStep === 6 ? "Submit" : "Next"}
            <IconArrowRight />
          </Link>
        </Button>
      </div>
    </ActionBar>
  );
};
