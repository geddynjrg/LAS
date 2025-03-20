"use client";

import { useTranslations } from "next-intl";
import React, { useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";

import { informantAction } from "@/app/add/informant/informant-action";
import {
  informantSchema,
  type InformantSchema,
} from "@/app/add/informant/informant-schema";
import type { Person } from "@/lib/schema/person-schema";
import { searchPerson } from "@/lib/services/birth-registration-service";
import { nationalities } from "@/lib/util/nationalities";

export interface FinalInformantFormProps {
  defaultValues?: Partial<
    InformantSchema & { father?: string | Person; mother?: string | Person }
  >;
}

export const FinalInformantForm: FC<FinalInformantFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const defaultNationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;
  const [state] = useForm(informantAction, informantSchema, defaultValues);
  const [natonalId, setNatonalId] = useState<boolean>(defaultNationalId);
  const [nationalIdOptions, setNationalIdOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  const fullName = [
    defaultValues?.firstName,
    defaultValues?.middleName,
    defaultValues?.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const nationalityOptions = nationalities.map((nationality) => ({
    label: nationality,
    value: nationality,
  }));

  const debouncedSearch = useDebouncedCallback(async (search?: string) => {
    if (!search) {
      setNationalIdOptions([]);
      return;
    }

    setIsLoading(true);
    const res = await searchPerson(search);

    const options = res.map((person: Person) => ({
      label: `${person.firstName} ${person.lastName} (${person.nationalId})`,
      value: person.nationalId,
    }));

    setNationalIdOptions(options);
    setIsLoading(false);
  }, 300);

  const handleSearch = (search?: string) => {
    debouncedSearch(search);
  };

  const informantTypeOptions = [
    { label: t("DetailsPage.mother"), value: t("DetailsPage.mother") },
    { label: t("DetailsPage.father"), value: t("DetailsPage.father") },
    { label: t("DetailsPage.other"), value: t("DetailsPage.other") },
  ];

  return (
    <DataBlock
      title={t(`DetailsPage.title-informant`)}
      disabled={undefined}
      active={undefined}
      toggleEdit={undefined}
    >
      <>
        <ButtonGroup
          name="informantType"
          onValueChange={() => {}}
          type="single"
          defaultValue={defaultValues?.informantType}
          disabled
        >
          <React.Fragment key=".0">
            {informantTypeOptions.map((option) => (
              <ButtonGroupItem key={option.value} value={option.value}>
                {option.label}
              </ButtonGroupItem>
            ))}
          </React.Fragment>
        </ButtonGroup>
      </>
      {natonalId && defaultValues?.nationalId && (
        <Field
          state={state}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          control={(props) => (
            <SearchInput
              {...props}
              isLoading={isLoading}
              onValueChange={handleSearch}
              options={nationalIdOptions}
            />
          )}
          editable={false}
        />
      )}

      <>
        <DataNode label={t("DetailsPage.name")} variant="default">
          <input
            type="hidden"
            name="firstName"
            value={defaultValues?.firstName}
          />
          <input
            type="hidden"
            name="middleName"
            value={defaultValues?.middleName}
          />
          <input
            type="hidden"
            name="lastName"
            value={defaultValues?.lastName}
          />

          {fullName && fullName !== " " ? fullName : "–"}
        </DataNode>
      </>

      {!natonalId && (
        <Field
          state={state}
          name="passportNumber"
          label={t("DetailsPage.passport-number")}
          control={(props) => <Input {...props} />}
          editable={false}
        />
      )}

      <Field
        state={state}
        name="dob"
        isDate
        label={t("DetailsPage.dob")}
        control={(props) => <DatePicker {...props} />}
        editable={false}
      />

      <Field
        state={state}
        name="citizenship"
        label={t("DetailsPage.citizenship")}
        control={(props) => <Input {...props} />}
        editable={false}
      />

      <Field
        state={state}
        name="nationality"
        label={t("DetailsPage.nationality")}
        control={(props) => (
          <SearchInput {...props} options={nationalityOptions} />
        )}
        editable={false}
      />

      <FieldGroup label={t("DetailsPage.capacity-of-informant")}>
        <p>{defaultValues?.capacityOfInformant}</p>
      </FieldGroup>

      <FieldGroup label={t("DetailsPage.nature-of-relation")}>
        <p>{defaultValues?.natureOfRelation}</p>
      </FieldGroup>

      <FieldGroup label={t("DetailsPage.phone")}>
        <p>
          {defaultValues?.phoneCode} {defaultValues?.phone}
        </p>
      </FieldGroup>

      <Field
        state={state}
        name="email"
        label={t("DetailsPage.email")}
        control={(props) => <Input {...props} />}
        editable={false}
      />
    </DataBlock>
  );
};
