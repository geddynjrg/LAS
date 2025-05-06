"use client";

import { useTranslations } from "next-intl";
import { Fragment, type FC } from "react";

import { DataBlock } from "@workspace/ui/components/civil-registry/data-block";
import { DataNode } from "@workspace/ui/components/data-node";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { informantAction } from "@/app/add/informant/informant-action";
import {
  informantSchema,
  type InformantSchema,
} from "@/app/add/informant/informant-schema";
import { nationalities } from "@/lib/util/nationalities";

export interface FinalInformantFormProps {
  defaultValues?: Partial<InformantSchema>;
}

export const FinalInformantForm: FC<FinalInformantFormProps> = ({
  defaultValues,
}) => {
  const t = useTranslations();
  const nationalId =
    !defaultValues?.nationalId &&
    defaultValues?.firstName &&
    defaultValues?.lastName
      ? false
      : true;
  const [state] = useForm(informantAction, informantSchema, defaultValues);

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

  return (
    <DataBlock
      title={t(`DetailsPage.title-informant`)}
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
        control={(props) => (
          <SearchInput {...props} options={nationalityOptions} />
        )}
        editable={false}
      />

      <FieldGroup label={t("DetailsPage.capacity-of-informant")}>
        <p>{defaultValues?.capacityOfInformant}</p>
      </FieldGroup>

      {defaultValues?.capacityOfInformant === "Other" && (
        <FieldGroup label={t("DetailsPage.specify-the-capacity")}>
          <p>{defaultValues?.capacityOfInformantOther}</p>
        </FieldGroup>
      )}

      {/* <FieldGroup label={t("DetailsPage.nature-of-relation")}>
        <p>{defaultValues?.natureOfRelation ?? "–"}</p>
      </FieldGroup> */}

      {defaultValues?.contacts?.map((contact, index) => (
        <Fragment key={index}>
          {contact?.phone && (
            <FieldGroup label={t("DetailsPage.phone")}>
              <p>
                +{contact?.phoneCode} {contact?.phone}
              </p>
            </FieldGroup>
          )}

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
