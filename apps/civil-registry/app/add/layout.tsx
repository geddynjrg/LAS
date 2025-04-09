import { getFormatter, getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import type { Step } from "@workspace/ui/components/stepper";

import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { FormStepper } from "@/app/add/form-stepper";

const steps: Step[] = [
  { index: 1, title: "Child", path: "/child" },
  { index: 2, title: "Mother", path: "/mother" },
  { index: 3, title: "Father", path: "/father" },
  { index: 4, title: "Informant", path: "/informant" },
  { index: 5, title: "Final review", path: "/final-review" },
];

export interface LayoutProps {
  children?: ReactNode;
}

export default async function IdLayout({ children }: LayoutProps) {
  const progress = await getFormProgress();
  const t = await getTranslations();
  const format = await getFormatter();

  const id = "#134345345";
  const today = format.dateTime(new Date(), {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <>
      <Container>
        <div className="mt-4 flex flex-row justify-between">
          <span>{today}</span>
          <span>{id}</span>
        </div>

        <h2 className="typo-h2">{t("DetailsPage.birth-notification")}</h2>
      </Container>

      <FormStepper key={progress} steps={steps} progress={progress} />

      {children}
    </>
  );
}

async function getFormProgress() {
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const informant = await getFormPersonByType("informant");
  const child = await getFormPersonByType("child");

  // check if person has national id and determine progress
  if (informant.nationalId) {
    return 5;
  }

  if (father.nationalId) {
    return 4;
  }

  if (mother.nationalId) {
    return 3;
  }

  // child does not have nationalId in form
  if (child[0]?.natureOfBirth) {
    return 2;
  }

  return 1;
}
