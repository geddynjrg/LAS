"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { ModalButton } from "@workspace/ui/components/modal-button";

import { updateApplicationStatusById } from "@/app/apply/[id]/review/update-application-status-by-id-action";
import { ApplicationStatus } from "@/generated/prisma";

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild type="button">
          <div>
            <IconArrowLeft />
            {t("Common.back")}
          </div>
        </Button>
        <ModalButton
          onConfirm={async () => {
            await updateApplicationStatusById(id, ApplicationStatus.SUBMITTED);
            router.push(`/apply/${id}/done`);
          }}
          cancelTitle={t("Common.back")}
          confirmTitle={t("Common.submit")}
          modalText={t("ReviewPage.confirmationDescription")}
          modalTitle={t("ReviewPage.confirmationTitle")}
          cancelButtonProps={{ variant: "secondary" }}
          contentProps={{ size: "sm" }}
          titleUnderline
        >
          {t("Common.submit")}
        </ModalButton>
      </div>
    </ActionBar>
  );
};
