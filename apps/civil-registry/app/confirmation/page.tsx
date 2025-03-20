"use server";

import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";

import { ConfirmationForm } from "@/app/confirmation/confirmation-form";
import {
  getFormPerson,
  saveForm,
} from "@/lib/services/birth-registration-service";

export interface ApplicantPageProps {
  params: Promise<{ id: string }>;
}

const save = async () => {
  saveForm();
};

export default async function ConfirmationPage({ params }: ApplicantPageProps) {
  // const { id } = await params;
  const t = await getTranslations();
  const person = await getFormPerson("mother");

  if (!person) return null;

  return (
    <>
      <Container>
        <h2 className="typo-h2 mt-15">{t("DetailsPage.birth-notification")}</h2>
      </Container>

      <ConfirmationForm defaultValues={person} saveForm={save} />
    </>
  );
}
