"use client";

import { useTranslations } from "next-intl";
import React, { useState, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";

import { fatherAction } from "@/app/add/father/father-action";
import {
  fatherSchema,
  type FatherSchema,
} from "@/app/add/father/father-schema";
import { educationOptions } from "@/lib/data/dummy-data";
import type { Person } from "@/lib/schema/person-schema";
import { searchPersonBySex } from "@/lib/services/birth-registration-service";
import { nationalities } from "@/lib/util/nationalities";

export interface FinalFatherFormProps {
  defaultValues?: Partial<
    FatherSchema & { father?: string | Person; mother?: string | Person }
  >;
}

export const FinalFatherForm: FC<FinalFatherFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const defaultNationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;
  const [state] = useForm(fatherAction, fatherSchema, defaultValues);
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

  const handleSearch = (search?: string) => {};

  return (
    <DataBlock
      title={t(`DetailsPage.title-father`)}
      disabled={undefined}
      active={undefined}
      toggleEdit={undefined}
    >
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

      <Field
        state={state}
        name="education"
        label={t("DetailsPage.education")}
        control={(props) => (
          <SearchInput {...props} options={educationOptions} />
        )}
        editable={false}
      />

      {defaultValues?.contacts?.map((contact, index) => (
        <>
          <FieldGroup label={t("DetailsPage.phone")}>
            <p>
              +{contact?.phoneCode} {contact?.phone}
            </p>
          </FieldGroup>

          {contact?.email && (
            <FieldGroup label={t("DetailsPage.email")}>
              <p>{contact?.email}</p>
            </FieldGroup>
          )}
        </>
      ))}
    </DataBlock>
  );
};
