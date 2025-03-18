import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/info-popover";

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
        </div>
      </Container>

      <InfoPopover />

      <LoanConditionsDataForm action={loanConditions} id={id} />
    </>
  );
}
