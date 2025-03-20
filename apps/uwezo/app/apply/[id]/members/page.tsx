import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/info-popover";

import { membersData } from "@/actions/apply-form/members-data";
import { MembersDataForm } from "@/app/apply/[id]/members/members-data-form";

export interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: MembersPageProps) {
  const { id } = await params;

  return (
    <>
      <Container>
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">Group members</h2>
            <p>
              Group is eligible for Uwezo Fund loan, if there are 10-15 members
            </p>
          </div>
        </div>
      </Container>

      <InfoPopover />

      <MembersDataForm action={membersData} id={id} />
    </>
  );
}
