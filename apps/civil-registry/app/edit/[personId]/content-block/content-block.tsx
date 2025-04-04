"use client";

import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
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

        <h2 className={cn("typo-h2")}>{person && getFullName(person)}</h2>

        <div className={cn("space-y-12")}>
          <ChildFormBlock
            key={"child-block"}
            defaultValues={person}
            disabled={isAmending && editablePersonId !== person.id}
            isEditing={editablePersonId === person.id}
            onEdit={() => toggleEdit(person.id)}
            onSubmit={(changedValues) => {
              toggleEdit(null);

              setRequirePayment(Object.keys(changedValues).length > 0);
            }}
          />
          {person.mother && (
            <MotherFormBlock
              key={"mother-block"}
              defaultValues={person.mother as Person}
              disabled={
                isAmending && editablePersonId !== (person.mother as Person).id
              }
              isEditing={editablePersonId === (person.mother as Person).id}
              onEdit={() => toggleEdit((person.mother as Person).id)}
              onSubmit={() => toggleEdit(null)}
            />
          )}
          {person.father && (
            <FatherFormBlock
              key={"father-block"}
              defaultValues={person.father as Person}
              disabled={
                isAmending && editablePersonId !== (person.father as Person).id
              }
              isEditing={editablePersonId === (person.father as Person).id}
              onEdit={() => toggleEdit((person.father as Person).id)}
              onSubmit={() => toggleEdit(null)}
            />
          )}
        </div>
      </SectionWrap>

      {!isAmending && requirePayment && (
        <PaymentBar
          price={250}
          onSubmit={async () => {
            await updatePersonStatusById(person?.id ?? "", "pending");
            return router.push(`${person.id}/payment`);
          }}
        />
      )}

      {!isAmending && !requirePayment && (
        <ActionBar>
          <Button asChild variant="secondary">
            <a
              href={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
              className={cn("!px-5")}
            >
              <IconArrowLeft /> {t("DetailsPage.back")}
            </a>
          </Button>
          <ModalButton
            modalTitle="Confirm registration?"
            modalText="Are you sure all the details of the birth registration are correct? You have the option to amend."
            onConfirm={async () => {
              await updatePersonStatusById(person?.id ?? "", "success");
              return router.push(`${person.id}/success`);
            }}
          >
            {t("DetailsPage.confirm-registration?")} <IconCheck />
          </ModalButton>
        </ActionBar>
      )}
    </>
  );
};
