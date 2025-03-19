import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

import { FormStepper } from "@/app/add/form-stepper";

export interface Step {
  index: number;
  title: string;
  path: string;
}
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
  const t = await getTranslations();

  return (
    <>
      <Container>
        <h2 className="typo-h2">{t("DetailsPage.birth-notification")}</h2>
      </Container>

      <FormStepper steps={steps} />

      {children}
    </>
  );
}
