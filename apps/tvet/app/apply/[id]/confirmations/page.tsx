import { ApplyFormStepper } from "@/app/apply/[id]/apply-form-stepper";
import { ApplyFormTitle } from "@/app/apply/[id]/apply-form-title";
import { ConfirmationsForm } from "@/app/apply/[id]/confirmations/confirmations-form";

export interface ConfirmationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationsPage({
  params,
}: ConfirmationsPageProps) {
  const { id } = await params;

  return (
    <>
      <ApplyFormTitle label="Waithaka Vocational Training Centre">
        Electrical installation training
      </ApplyFormTitle>

      <ApplyFormStepper activeStep={4} />

      <ConfirmationsForm id={id} defaultValues={{}} />
    </>
  );
}
