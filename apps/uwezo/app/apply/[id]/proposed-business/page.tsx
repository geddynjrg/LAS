import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/info-popover";

import { proposedBusiness } from "@/actions/apply-form/proposed-business";
import { ProposedBusinessDataForm } from "@/app/apply/[id]/proposed-business/proposed-business-data-form";

export interface ProposedBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ProposedBusinessPageProps) {
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

      <ProposedBusinessDataForm action={proposedBusiness} id={id} />
    </>
  );
}
