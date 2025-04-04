"use client";

import { useTranslations } from "next-intl";
import React, { useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { Field } from "@workspace/ui/components/form";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { FormWrap } from "@/app/add/form-wrap";
import { informantAction } from "@/app/add/informant/informant-action";
import {
  informantSchema,
  type InformantSchema,
} from "@/app/add/informant/informant-schema";
import { ContactFields } from "@/components/contact-fields";
import { NationalIdFields } from "@/components/national-id-fields";
import type { Person } from "@/lib/data/person";

type InformantType = "Mother" | "Father" | "Other";

export interface InformantFormProps {
  id: string;
  informant: Partial<InformantSchema>;
  mother: Person | undefined;
  father: Person | undefined;
}

export const InformantForm: FC<InformantFormProps> = ({
  id,
  informant,
  mother,
  father,
}) => {
  const t = useTranslations();
  const defaultValues = informant;

  const [informantType, setInformantType] = useState<InformantType>(
    (informant?.informantType as InformantType) ?? "Other",
  );

  const [state, formAction, isPending] = useForm(
    informantAction,
    informantSchema,
    defaultValues,
  );

  function getFullName() {
    switch (informantType) {
      case "Mother":
        return [mother?.firstName, mother?.middleName, mother?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

      case "Father":
        return [father?.firstName, father?.middleName, father?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

      default:
        return "";
    }
  }

  const informantOptions = [
    { label: t("DetailsPage.family-member"), value: "Family member" },
    { label: t("DetailsPage.tba"), value: "T.B.A" },
    { label: t("DetailsPage.midwife"), value: "Midwife" },
    { label: t("DetailsPage.medical-attendant"), value: "Medical Attendant" },
    { label: t("DetailsPage.other"), value: "Other" },
  ];

  const relationOptions = [
    { label: t("DetailsPage.parent"), value: "Parent" },
    { label: t("DetailsPage.sibling"), value: "Sibling" },
    { label: t("DetailsPage.spouse"), value: "Spouse" },
    { label: t("DetailsPage.guardian"), value: "Guardian" },
    { label: t("DetailsPage.relative"), value: "Relative" },
    { label: t("DetailsPage.friend"), value: "Friend" },
    { label: t("DetailsPage.colleague"), value: "Colleague" },
    { label: t("DetailsPage.neighbor"), value: "Neighbor" },
    { label: t("DetailsPage.employer"), value: "Employer" },
    { label: t("DetailsPage.employee"), value: "Employee" },
    { label: t("DetailsPage.partner"), value: "Partner" },
    { label: t("DetailsPage.other"), value: "Other" },
  ];

  const informantTypeOptions = [
    { label: t("DetailsPage.mother"), value: "Mother" },
    { label: t("DetailsPage.father"), value: "Father" },
    { label: t("DetailsPage.other"), value: "Other" },
  ] as const;

  return (
    <FormWrap
      action={formAction}
      isPending={isPending}
      prevUrl="/add/father"
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />

      <DataBlock
        title={t(`DetailsPage.title-informant`)}
        disabled={undefined}
        active={undefined}
        toggleEdit={undefined}
      >
        <>
          <ButtonGroup
            name="informantType"
            onValueChange={(value) => setInformantType(value as InformantType)}
            type="single"
            defaultValue={informantType}
          >
            {informantTypeOptions.map((option) => (
              <ButtonGroupItem key={option.value} value={option.value}>
                {option.label}
              </ButtonGroupItem>
            ))}
          </ButtonGroup>
        </>

        {informantType === "Other" ? (
          <>
            <NationalIdFields searchSexFilter="M" state={state} />

            <Field
              state={state}
              control={(props) => (
                <RadioGroup
                  {...props}
                  orientation="vertical"
                  size="md"
                  options={informantOptions}
                />
              )}
              label={t("DetailsPage.capacity-of-informant")}
              name="capacityOfInformant"
              required
            />

            <Field
              state={state}
              name="natureOfRelation"
              label={t("DetailsPage.nature-of-relation")}
              control={(props) => (
                <SearchInput {...props} options={relationOptions} />
              )}
              required
            />

            <ContactFields state={state} />
          </>
        ) : (
          <DataNode label={t("DetailsPage.name")} variant="default">
            <PersonFields
              informantType={informantType}
              person={informantType === "Mother" ? mother : father}
            />

            {getFullName()}
          </DataNode>
        )}
      </DataBlock>
    </FormWrap>
  );
};

const PersonFields: FC<{
  informantType: InformantType;
  person?: Person;
}> = ({ informantType, person }) => {
  const fields: {
    [K in keyof Omit<InformantSchema, "id" | "informantType" | "contacts">]:
      | InformantSchema[K]
      | undefined;
  } = {
    firstName: person?.firstName,
    middleName: person?.middleName,
    lastName: person?.lastName,
    nationalId: person?.nationalId,
    citizenship: person?.citizenship,
    passportNumber: person?.passportNumber,
    dob: person?.dob,
    nationality: person?.nationality,
    capacityOfInformant: informantType === "Other" ? "Other" : "Parent",
  };

  return (
    <>
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      {person?.contacts?.map((contact, index) => (
        <React.Fragment key={`contact-${index}`}>
          <input
            type="hidden"
            name={`contacts.${index}.phoneCode`}
            value={contact.phoneCode}
          />
          <input
            type="hidden"
            name={`contacts.${index}.phone`}
            value={contact.phone}
          />
          <input
            type="hidden"
            name={`contacts.${index}.email`}
            value={contact.email}
          />
        </React.Fragment>
      ))}
    </>
  );
};
