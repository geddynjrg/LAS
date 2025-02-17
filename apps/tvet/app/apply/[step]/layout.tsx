import { ReactNode } from "react";

import { Stepper } from "@workspace/ui/components/stepper";

export interface StepLayoutProps {
  params: Promise<{ step: string }>;
  children?: ReactNode;
}

export default async function StepLayout({
  children,
  params,
}: StepLayoutProps) {
  const activeStep = Number((await params).step);

  return (
    <div>
      <div className="m-4">
        <p>Waithaka Vocational Training Centre</p>
        <h1 className="typo-h2">Electrical installation training</h1>
      </div>
      <Stepper
        steps={["Applicant", "Guardian", "Course", "Confirmations", "Payment"]}
        activeStep={activeStep}
      />

      <div className="m-4">{children}</div>
    </div>
  );
}
