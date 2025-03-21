import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { Authenticated } from "@/components/authenticated";
import { auth } from "@/lib/auth";

export interface ApplyStep {
  index: number;
  title: string;
  path: string;
}

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default async function IdLayout({ children }: ApplyLayoutProps) {
  const t = await getTranslations();
  const session = await auth();

  const steps: ApplyStep[] = [
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
    {
      index: 6,
      title: t("ApplicationDetailsPage.groupData.steps.finalReview"),
      path: "/finish",
    },
  ];

  return (
    <Authenticated session={session}>
      <ApplyFormStepper steps={steps} />

      {children}
    </Authenticated>
  );
}
