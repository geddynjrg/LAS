"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { SubmitButton } from "@workspace/ui/components/form";
import { ModalButton } from "@workspace/ui/components/modal-button";
import { cn } from "@workspace/ui/lib/utils";

import { steps } from "@/lib/constants";

interface ApplyFormActionBarProps {
  disabled?: boolean;
  nextUrl?: string;
  prevUrl?: string;
  onBack?: () => void;
}

export const ApplyFormModalActionBar: FC<ApplyFormActionBarProps> = ({
  prevUrl,
  onBack,
}) => {
  const pathName = usePathname();
  const t = useTranslations();
  const router = useRouter();

  const activeStep =
    steps.find((step) => pathName.includes(step.path))?.index ?? 1;

  console.log(activeStep);

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild onClick={onBack} type="button">
          {onBack && !prevUrl ? (
            <div>{t("Common.back")}</div>
          ) : (
            <Link href={prevUrl || "#"}>{t("Common.back")}</Link>
          )}
        </Button>
        <ModalButton
          onConfirm={() => router.push("done")}
          cancelTitle="Back"
          confirmTitle="Submit"
          modalText="Are you sure all the information in the application is correct and you want to submit?"
          modalTitle="Submit application"
        >
          Submit
        </ModalButton>
      </div>
    </ActionBar>
  );
};
