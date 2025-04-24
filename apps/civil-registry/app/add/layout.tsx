import { getFormatter } from "next-intl/server";
import { ReactNode } from "react";

import { getFormPersonByType } from "@/actions/get-form-person-by-type";
import { IdLayoutWrapper } from "@/app/add/layout-wrapper";

export interface LayoutProps {
  children?: ReactNode;
}

export default async function IdLayout({ children }: LayoutProps) {
  const progress = await getFormProgress();
  const format = await getFormatter();
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");

  const id = "#134345345";
  const today = format.dateTime(new Date(), {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <IdLayoutWrapper
      progress={progress}
      mother={mother}
      father={father}
      id={id}
      today={today}
    >
      {children}
    </IdLayoutWrapper>
  );
}

async function getFormProgress() {
  const mother = await getFormPersonByType("mother");
  const father = await getFormPersonByType("father");
  const informant = await getFormPersonByType("informant");
  const child = await getFormPersonByType("child");

  // check if person has national id and determine progress
  if (informant.firstName) {
    return 5;
  }

  if (
    father.firstName ||
    (mother?.maritalStatus !== "Married" && mother?.firstName)
  ) {
    return 4;
  }

  if (mother.firstName) {
    return 3;
  }

  // child does not have nationalId in form
  if (child[0]?.natureOfBirth) {
    return 2;
  }

  return 1;
}
