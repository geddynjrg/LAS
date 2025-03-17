import { Container } from "@workspace/ui/components/container";

import { groupData } from "@/actions/apply-form/group-data";
import { GroupDataForm } from "@/app/apply/[id]/group-data/group-data-form";

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;

  return (
    <>
      <Container>
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">Group data</h2>
          </div>
          {/* TODO: Add the help component here */}
          <div>Help</div>
        </div>
      </Container>

      <GroupDataForm action={groupData} id={id} />
    </>
  );
}
