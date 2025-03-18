import { GuardianForm } from "@/app/apply/[id]/guardian/guardian-form";

export interface GuardianPageProps {
  params: Promise<{ id: string }>;
}

export default async function GuardianPage({ params }: GuardianPageProps) {
  const { id } = await params;

  return <GuardianForm id={id} defaultValues={{}} />;
}
