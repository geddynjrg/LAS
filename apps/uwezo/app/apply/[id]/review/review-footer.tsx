"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { ModalButton } from "@workspace/ui/components/modal-button";

import { updateApplicationStatusById } from "@/actions/apply-form/update-application-status-by-id";

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const t = useTranslations();
  const prevUrl = `/apply/${id}/confirmations`;
  const router = useRouter();

  return (
    <ActionBar className="mt-8">
      <div className="mx-auto flex flex-row items-center gap-4">
        <Button variant="secondary" asChild type="button">
          <Link href={prevUrl || "#"}>{t("Common.back")}</Link>
        </Button>
        <ModalButton
          onConfirm={async () => {
            await updateApplicationStatusById(id);
            router.push(`/apply/${id}/done`);
          }}
          cancelTitle={t("Common.back")}
          confirmTitle={t("Common.submit")}
          modalText={t("ReviewPage.confirmationDescription")}
          modalTitle={t("ReviewPage.confirmationTitle")}
        >
          {t("Common.submit")}
        </ModalButton>
      </div>
    </ActionBar>
  );
};
