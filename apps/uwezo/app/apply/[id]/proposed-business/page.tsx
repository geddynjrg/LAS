import { Container } from "@workspace/ui/components/container";

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
          {/* TODO: Add the help component here */}
          <div>Help</div>
        </div>
      </Container>

      <ProposedBusinessDataForm action={proposedBusiness} id={id} />
    </>
  );
}
