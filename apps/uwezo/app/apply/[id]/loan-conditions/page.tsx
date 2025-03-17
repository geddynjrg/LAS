import { Container } from "@workspace/ui/components/container";

import { loanConditions } from "@/actions/apply-form/loan-conditions";
import { LoanConditionsDataForm } from "@/app/apply/[id]/loan-conditions/loan-conditions-data-form";

export interface LoanConditionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: LoanConditionsPageProps) {
  const { id } = await params;

  return (
    <>
      <Container>
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">Loan conditions</h2>
          </div>
          {/* TODO: Add the help component here */}
          <div>Help</div>
        </div>
      </Container>

      <LoanConditionsDataForm action={loanConditions} id={id} />
    </>
  );
}
