import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import type { Step } from "@workspace/ui/components/stepper";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { getApplicationById } from "@/lib/data/application-db";
import { getSession } from "@/lib/session";

export interface ApplyLayoutProps {
  params: Promise<{ id: string }>;
  children?: ReactNode;
}

export default async function IdLayout({ params, children }: ApplyLayoutProps) {
  const { id } = await params;
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    redirect(`/login?callbackUrl=/apply/${id}`);
  }

  const application = await getApplicationById(id);

  const steps: Step[] = [
    {
      index: 1,
      title: t("ApplicationDetailsPage.groupData.groupData"),
      path: "/group-data",
    },
    {
      index: 2,
      title: t("ApplicationDetailsPage.groupData.steps.groupMembers"),
      path: "/members",
    },
    {
      index: 3,
      title: t("ApplicationDetailsPage.loan.loanConditions"),
      path: "/loan-conditions",
    },
    {
      index: 4,
      title: t("ApplicationDetailsPage.proposedBusiness.proposedBusiness"),
      path: "/proposed-business",
    },
    {
      index: 5,
      title: t("ApplicationDetailsPage.groupData.steps.confirmations"),
      path: "/confirmations",
    },
  ];

  return (
    <>
      <ApplyFormStepper
        steps={steps}
        applicationProgress={
          application?.generalDetails.applicationProgress ?? 0
        }
        baseUrl={`/apply/${id}`}
      />

      {children}
    </>
  );
}
