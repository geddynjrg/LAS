"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { SubmitButton } from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import { steps } from "@/lib/constants";

interface ApplyFormActionBarProps {
  disabled?: boolean;
  nextUrl?: string;
  prevUrl?: string;
  onBack?: () => void;
  className?: string;
}

export const ApplyFormActionBar: FC<ApplyFormActionBarProps> = ({
  disabled,
  nextUrl,
  prevUrl,
  onBack,
  className,
}) => {
  const pathName = usePathname();
  const t = useTranslations();

  const activeStep =
    steps.find((step) => pathName.includes(step.path))?.index ?? 1;

  return (
    <ActionBar className={cn("mt-8", className)}>
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild onClick={onBack} type="button">
          {onBack && !prevUrl ? (
            <div>
              <IconArrowLeft />
              {t("Common.back")}
            </div>
          ) : (
            <Link href={prevUrl || "#"}>
              <IconArrowLeft />
              {t("Common.back")}
            </Link>
          )}
        </Button>
        {(activeStep === 6 || activeStep === 5) && nextUrl ? (
          <Button disabled={disabled}>
            <Link
              href={nextUrl}
              className={cn(
                "text-background flex flex-row gap-1",
                disabled && "text-neutral-400",
              )}
            >
              {activeStep === 6 ? t("Common.submit") : t("Common.next")}
              <IconArrowRight />
            </Link>
          </Button>
        ) : (
          <SubmitButton disabled={disabled}>
            <div className="flex flex-row gap-1">
              {t("Common.next")}
              <IconArrowRight />
            </div>
          </SubmitButton>
        )}
      </div>
    </ActionBar>
  );
};
