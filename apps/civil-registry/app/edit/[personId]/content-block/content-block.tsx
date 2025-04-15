"use client";

import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FC } from "react";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { BackButton } from "@workspace/ui/components/civil-registry/back-button";
import { SectionWrap } from "@workspace/ui/components/civil-registry/section-wrap";
import { ModalButton } from "@workspace/ui/components/modal-button";
import { cn } from "@workspace/ui/lib/utils";

import { updatePersonStatusById } from "@/actions/update-person-status-by-id";
import { ChildFormBlock } from "@/app/edit/[personId]/child/child-form";
import { FatherFormBlock } from "@/app/edit/[personId]/father/father-form";
import { MotherFormBlock } from "@/app/edit/[personId]/mother/mother-form";
import { PaymentBar } from "@/app/edit/[personId]/payment-bar/payment-bar";
import type { Person } from "@/lib/data/person";
import { getFullName } from "@/lib/util/full-name";

interface ContentBlockProps {
  person: Person;
}

export const ContentBlock: FC<ContentBlockProps> = ({ person }) => {
  const router = useRouter();
  const [editablePersonId, setEditablePersonId] = useState<string | null>(null);
  const [requirePayment, setRequirePayment] = useState(false);
  const [editedPersonName, setEditedPersonName] = useState<string | null>(null);

  const father = person.father as Person;
  const mother = person.mother as Person;

  const t = useTranslations();

  function toggleEdit(id: string | null) {
    if (editablePersonId === id) {
      setEditablePersonId(null);
    } else {
      setEditablePersonId(id);
    }
  }

  const isAmending = editablePersonId !== null;

  return (
    <>
      <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
        <BackButton
          url={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
        />

        <h2 className={cn("typo-h2")}>
          {editedPersonName ?? (person && getFullName(person))}
        </h2>

        <div className={cn("space-y-12")}>
          <ChildFormBlock
            defaultValues={person}
            disabled={isAmending && editablePersonId !== person.id}
            isEditing={editablePersonId === person.id}
            onEdit={() => toggleEdit(person.id)}
            onSubmit={(changedValues) => {
              if (
                "firstName" in changedValues ||
                "middleName" in changedValues ||
                "lastName" in changedValues
              ) {
                const name = [
                  changedValues.firstName ?? person.firstName,
                  changedValues.middleName ?? person.middleName,
                  changedValues.lastName ?? person.lastName,
                ]
                  .filter(Boolean)
                  .join(" ");

                setEditedPersonName(name);
              }
              toggleEdit(null);

              setRequirePayment(Object.keys(changedValues).length > 0);
            }}
          />
          {person.mother && (
            <MotherFormBlock
              defaultValues={mother}
              disabled={isAmending && editablePersonId !== mother.id}
              isEditing={editablePersonId === mother.id}
              onEdit={() => toggleEdit(mother.id)}
              onSubmit={() => toggleEdit(null)}
            />
          )}
          {person.father && (
            <FatherFormBlock
              defaultValues={father}
              disabled={isAmending && editablePersonId !== father.id}
              isEditing={editablePersonId === father.id}
              onEdit={() => toggleEdit(father.id)}
              onSubmit={() => toggleEdit(null)}
            />
          )}
        </div>
      </SectionWrap>

      {!isAmending && requirePayment && (
        <PaymentBar
          price={250}
          onConfirm={async () => {
            await updatePersonStatusById(person?.id ?? "", "pending");
            return router.push(`${person.id}/payment`);
          }}
        />
      )}

      {!isAmending && !requirePayment && (
        <ActionBar>
          <Button asChild variant="secondary">
            <Link
              href={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
              className={cn("!px-5")}
            >
              <IconArrowLeft /> {t("DetailsPage.back")}
            </Link>
          </Button>
          <ModalButton
            modalTitle={t("ConfirmRegistration.title")}
            modalText={t("ConfirmRegistration.content")}
            onConfirm={async () => {
              await updatePersonStatusById(person?.id ?? "", "success");
              return router.push(`${person.id}/success`);
            }}
          >
            {t("DetailsPage.confirm-registration")} <IconCheck />
          </ModalButton>
        </ActionBar>
      )}
    </>
  );
};
