"use client";

import { IconCaretDownFilled } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { Fragment, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { fatherAction } from "@/app/add/father/father-action";
import {
  fatherSchema,
  type FatherSchema,
} from "@/app/add/father/father-schema";
import { educationOptions } from "@/lib/data/dummy-data";

export interface FinalFatherFormProps {
  defaultValues?: Partial<FatherSchema>;
}

export const FinalFatherForm: FC<FinalFatherFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const nationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;

  const [state] = useForm(fatherAction, fatherSchema, defaultValues);

  const fullName = [
    defaultValues?.firstName,
    defaultValues?.middleName,
    defaultValues?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DataBlock
      title={t(`DetailsPage.title-father`)}
      disabled={undefined}
      active={undefined}
      toggleEdit={undefined}
    >
      {nationalId && defaultValues?.nationalId && (
        <Field
          state={state}
          name="nationalId"
          label={t("DetailsPage.national-id")}
          control={(props) => <SearchInput {...props} />}
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

      {!nationalId && (
        <Field
          state={state}
          name="documentType"
          label={t("DetailsPage.document-type")}
          control={(props) => <Input {...props} />}
          editable={false}
        />
      )}
      {!nationalId && (
        <Field
          state={state}
          name="passportNumber"
          label={t("DetailsPage.document-number")}
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

      {!nationalId && (
        <Field
          state={state}
          name="citizenship"
          label={t("DetailsPage.citizenship")}
          control={(props) => <Input {...props} />}
          editable={false}
        />
      )}

      <Field
        state={state}
        name="nationality"
        label={t("DetailsPage.nationality")}
        control={(props) => <SearchInput {...props} />}
        editable={false}
      />

      {/* <Field
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
      /> */}

      {defaultValues?.contacts?.map((contact, index) => (
        <Fragment key={index}>
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
        </Fragment>
      ))}
    </DataBlock>
  );
};
