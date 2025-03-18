import { ConfirmationsForm } from "@/app/apply/[id]/confirmations/confirmations-form";

export interface ConfirmationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationsPage({
  params,
}: ConfirmationsPageProps) {
  const { id } = await params;

  return <ConfirmationsForm id={id} defaultValues={{}} />;
}
