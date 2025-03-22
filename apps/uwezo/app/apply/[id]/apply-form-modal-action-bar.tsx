"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { ModalButton } from "@workspace/ui/components/modal-button";

interface ApplyFormActionBarProps {
  prevUrl?: string;
  onBack?: () => void;
  onSubmit?: () => void;
}

export const ApplyFormModalActionBar: FC<ApplyFormActionBarProps> = ({
  prevUrl,
  onBack,
  onSubmit,
}) => {
  const t = useTranslations();

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
          onConfirm={onSubmit}
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
