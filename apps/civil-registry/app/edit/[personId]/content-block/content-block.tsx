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
import { PaymentBar } from "@/app/edit/[personId]/payment-bar/payment-bar";
import {
  PersonFormBlock,
  PersonType,
} from "@/app/edit/[personId]/person-block/person-form-block";
import type { Person } from "@/lib/data/person";
import { getFullName } from "@/lib/util/full-name";

interface ContentBlockProps {
  person: Person;
}

export const ContentBlock: FC<ContentBlockProps> = ({ person }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState("");
  const [requirePayment, setRequirePayment] = useState(false);

  const t = useTranslations();

  const toggleEdit = (id: string, reqPayment?: boolean) => {
    setIsEditing(id === isEditing ? "" : id);

    if (reqPayment) {
      setRequirePayment(reqPayment ?? false);
    }
  };

  const isPersonEditing = (id: string) => {
    if (!id || !isEditing) return false;

    return isEditing === id;
  };

  return (
    <>
      <SectionWrap className={cn("space-y-6")} hasTopPadding hasBottomPadding>
        <BackButton
          url={`/${typeof person.mother === "string" ? person.mother : person.mother?.id}`}
        />

        <h2 className={cn("typo-h2")}>{person && getFullName(person)}</h2>

        <div className={cn("space-y-12")}>
          <PersonFormBlock
            disabled={isEditing !== "" && isEditing !== person.id}
            active={isPersonEditing(person?.id ?? "")}
            toggleEdit={toggleEdit}
            fields={{
              name: { isEditable: true, isVisible: true },
              dob: { isEditable: false, isVisible: true },
              age: {
                isEditable: false,
                isVisible: isEditing !== "" && isEditing !== person.id,
              },
              sex: { isEditable: false, isVisible: true },
              weightOnBirth: { isEditable: false, isVisible: true },
              placeOfBirth: { isEditable: false, isVisible: true },
              firstName: { isEditable: true, isVisible: false },
              middleName: { isEditable: true, isVisible: false },
            }}
            showFieldNotifications={isPersonEditing(person?.id ?? "")}
            data={person}
            type={PersonType.CHILD}
          />
          {person.mother && (
            <PersonFormBlock
              disabled={
                isEditing !== "" && isEditing !== (person.mother as Person).id
              }
              active={isPersonEditing((person.mother as Person)?.id ?? "")}
              toggleEdit={toggleEdit}
              fields={{
                name: { isEditable: false, isVisible: true },
                nationalId: { isEditable: false, isVisible: true },
                dob: { isEditable: false, isVisible: true },
                citizenship: { isEditable: false, isVisible: true },
                nationality: { isEditable: true, isVisible: true },
                maritalStatus: { isEditable: true, isVisible: true },
                education: { isEditable: true, isVisible: true },
                father: { isEditable: true, isVisible: true },
                phone: { isEditable: false, isVisible: true },
              }}
              data={person.mother as Person}
              type={PersonType.MOTHER}
            />
          )}
          {person.father && (
            <PersonFormBlock
              disabled={
                isEditing !== "" && isEditing !== (person.father as Person).id
              }
              active={isPersonEditing((person.father as Person)?.id ?? "")}
              toggleEdit={toggleEdit}
              fields={{
                name: { isEditable: false, isVisible: true },
                nationalId: { isEditable: true, isVisible: true },
                dob: { isEditable: false, isVisible: true },
                citizenship: { isEditable: false, isVisible: true },
                nationality: { isEditable: true, isVisible: true },
                education: { isEditable: true, isVisible: true },
                phone: { isEditable: true, isVisible: true },
              }}
              data={person.father as Person}
              affidavitRequired
              type={PersonType.FATHER}
            />
          )}
        </div>
      </SectionWrap>

      {isEditing == "" && requirePayment && (
        <PaymentBar
          price={250}
          onSubmit={async () => {
            await updatePersonStatusById(person?.id ?? "", "pending");
            return router.push(`${person.id}/payment`);
          }}
        />
      )}

      {isEditing == "" && !requirePayment && (
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
