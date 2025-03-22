"use client";

import { useRouter } from "next/navigation";
import { type FC } from "react";

import { updateApplicationStatusById } from "@/actions/apply-form/update-application-status-by-id";
import { ApplyFormModalActionBar } from "@/app/apply/[id]/apply-form-modal-action-bar";

export interface ReviewDataProps {
  id: string;
}

export const ReviewFooter: FC<ReviewDataProps> = ({ id }) => {
  const prevUrl = `/apply/${id}/confirmations`;
  const router = useRouter();

  return (
    <ApplyFormModalActionBar
      prevUrl={prevUrl}
      onSubmit={async () => {
        await updateApplicationStatusById(id);
        router.push(`/apply/${id}/done`);
      }}
    />
  );
};
