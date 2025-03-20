"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { SubmitButton } from "@workspace/ui/components/form";

import { steps } from "@/lib/constants";

interface ApplyFormActionBarProps {
  disabled?: boolean;
  nextUrl: string;
  prevUrl: string;
}

export const ApplyFormActionBar: FC<ApplyFormActionBarProps> = ({
  disabled,
  nextUrl,
  prevUrl,
}) => {
  const pathName = usePathname();
  const t = useTranslations();

  const activeStep =
    steps.find((step) => pathName.includes(step.path))?.index ?? 1;

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild>
          <Link href={prevUrl}>
            <IconArrowLeft />
            {t("Common.back")}
          </Link>
        </Button>
        {activeStep === 6 ? (
          <Button asChild disabled={disabled}>
            <Link href={nextUrl}>
              {t("Common.next")}
              <IconArrowRight />
            </Link>
          </Button>
        ) : (
          <SubmitButton disabled={disabled}>
            <div className="flex flex-row gap-1">
              {t("Common.submit")}
              <IconArrowRight />
            </div>
          </SubmitButton>
        )}
      </div>
    </ActionBar>
  );
};
