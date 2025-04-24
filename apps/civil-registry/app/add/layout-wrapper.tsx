"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import type { Step } from "@workspace/ui/components/stepper";

import { FormStepper } from "@/app/add/form-stepper";
import { usePersonNationalIdStatus } from "@/hooks/usePersonNationalIdStatus";
import type { Person } from "@/lib/data/person";

export function IdLayoutWrapper({
  progress,
  id,
  today,
  children,
  mother,
  father,
}: {
  progress: number;
  id: string;
  today: string;
  children?: ReactNode;
  mother?: Partial<Person>
  father?: Partial<Person>
}) {
  const { isNationalIdUnknown } = usePersonNationalIdStatus();
  const t = useTranslations();
	let fatherUrl: string | undefined = '/father';
	let informantUrl: string | undefined = '/informant';

  if (mother?.maritalStatus === 'Married') {
	if (!father?.firstName) {
		informantUrl = undefined;
	}
  } else {
	fatherUrl = undefined;
  }

  const steps: Step[] = [
    { index: 1, title: t("Stepper.Child"), path: "/child" },
    { index: 2, title: t("Stepper.Mother"), path: "/mother" },
    { index: 3, title: t("Stepper.Father"), path: fatherUrl },
    { index: 4, title: t("Stepper.Informant"), path: informantUrl },
    { index: 5, title: t("Stepper.FinalReview"), path: "/final-review" },
  ];

  return (
    <>
      <Container>
        <div className="mt-4 flex flex-row justify-between">
          <span>{today}</span>
          <span>{id}</span>
        </div>

        <h2 className="typo-h2">
          {!isNationalIdUnknown
            ? t("DetailsPage.birth-notification")
            : t("DetailsPage.birth-registration")}
        </h2>
      </Container>

      <FormStepper key={progress} steps={steps} progress={progress} />

      {children}
    </>
  );
}
