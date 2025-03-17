import { ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";

import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { Authenticated } from "@/components/authenticated";

export interface ApplyStep {
  index: number;
  title: string;
  path: string;
}

const steps: ApplyStep[] = [
  { index: 1, title: "Applicant", path: "/applicant" },
  { index: 2, title: "Guardian", path: "/guardian" },
  { index: 3, title: "Course", path: "/course" },
  { index: 4, title: "Confirmations", path: "/confirmations" },
  { index: 5, title: "Payment", path: "/payment" },
];

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default async function IdLayout({ children }: ApplyLayoutProps) {
  return (
    <Authenticated>
      <Container>
        <p>Waithaka Vocational Training Centre</p>
        <h2 className="typo-h2">Electrical installation training</h2>
      </Container>

      <ApplyFormStepper steps={steps} />

      {children}
    </Authenticated>
  );
}
