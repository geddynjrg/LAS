import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import type { Step } from "@workspace/ui/components/stepper";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { Authenticated } from "@/components/authenticated";
import { auth } from "@/lib/auth";
import { getApplicationById } from "@/lib/data/application";

export interface ApplyLayoutProps {
  params: Promise<{ id: string }>;
  children?: ReactNode;
}

export default async function IdLayout({ params, children }: ApplyLayoutProps) {
  const { id } = await params;
  const t = await getTranslations();
  const session = await auth();
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
    <Authenticated session={session}>
      <ApplyFormStepper
        steps={steps}
        applicationProgress={
          application?.generalDetails.applicationProgress ?? 0
        }
        baseUrl={`/apply/${id}`}
      />

      {children}
    </Authenticated>
  );
}
