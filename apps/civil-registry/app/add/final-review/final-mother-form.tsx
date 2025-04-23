"use client";

import { IconCaretDownFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { motherAction } from "@/app/add/mother/mother-action";
import {
  motherSchema,
  type MotherSchema,
} from "@/app/add/mother/mother-schema";
import { educationOptions } from "@/lib/data/dummy-data";

export interface FinalMotherFormProps {
  defaultValues?: Partial<MotherSchema>;
}

export const FinalMotherForm: FC<FinalMotherFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const nationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;

  const [state] = useForm(motherAction, motherSchema, defaultValues);

  const fullName = [
    defaultValues?.firstName,
    defaultValues?.middleName,
    defaultValues?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DataBlock
      title={t(`DetailsPage.title-mother`)}
      disabled={undefined}
      active={undefined}
      toggleEdit={undefined}
    >
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

      {nationalId && defaultValues?.nationalId && (
        <Field
          state={state}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          control={(props) => <SearchInput {...props} />}
          editable={false}
        />
      )}

      {!nationalId && (
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
        control={(props) => <SearchInput {...props} />}
        editable={false}
      />

      <Field
        state={state}
        control={(props) => (
          <RadioGroup {...props} orientation="vertical" size="md" />
        )}
        label={t("DetailsPage.marital-status")}
        name="maritalStatus"
        editable={false}
      />

      <Field
        state={state}
        name="education"
        label={t("DetailsPage.education")}
        control={(props) => (
          <SearchInput
            {...props}
            options={educationOptions}
            endDecorator={<IconCaretDownFilled />}
          />
        )}
        editable={false}
      />

      <Field
        state={state}
        name="fatherName"
        label={t("DetailsPage.fathers-name")}
        control={(props) => <Input {...props} />}
        editable={false}
      />

      {defaultValues?.contacts?.map((contact, index) => (
        <FieldGroup label={t("DetailsPage.phone")} key={index}>
          <p>
            +{contact?.phoneCode} {contact?.phone}
          </p>
        </FieldGroup>
      ))}
    </DataBlock>
  );
};
