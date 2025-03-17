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

const steps: ApplyStep[] = [
  { index: 1, title: "Group data", path: "/group-data" },
  { index: 2, title: "Group members", path: "/members" },
  { index: 3, title: "Loan conditions", path: "/loan-conditions" },
  { index: 4, title: "Proposed business", path: "/proposed-business" },
  { index: 5, title: "Confirmations", path: "/confirmations" },
  { index: 6, title: "Final review", path: "/finish" },
];

export interface ApplyLayoutProps {
  children?: ReactNode;
}

export default async function IdLayout({ children }: ApplyLayoutProps) {
  const session = await auth();

  return (
    <Authenticated session={session}>
      <ApplyFormStepper steps={steps} />

      {children}
    </Authenticated>
  );
}
