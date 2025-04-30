"use client";

import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, type FormFieldState } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";

import {
  FILE_ACCEPT,
  idType,
  MAX_FILE_SIZE,
  type ApplicantSchema,
  type IdType,
} from "@/app/apply/[id]/applicant/applicant-schema";

export interface IdTypeFieldsProps {
  state: FormFieldState<
    Pick<
      ApplicantSchema,
      | "applicant_id_type"
      | "applicant_id_number"
      | "birth_certificate_number"
      | "birth_certificate_file"
      | "alien_id_number"
      | "is_refugee"
    >
  >;
}

export const IdTypeFields: FC<IdTypeFieldsProps> = ({ state }) => {
  const t = useTranslations();

  const nationalIdTypes = Object.values(idType.Values).map((value) => ({
    label: t(`NationalIdType.${value}`),
    value,
  }));

  const [chosenNationalIdType, setChosenNationalIdType] = useState(
    state.values?.applicant_id_type,
  );

  return (
    <>
      <Field
        state={state}
        name="applicant_id_type"
        label={t("ApplicantForm.idType")}
        required
        control={(props) => (
          <RadioGroup
            {...props}
            onValueChange={setChosenNationalIdType}
            options={nationalIdTypes}
          />
        )}
      />

      <FieldsByIdType
        state={state}
        chosenNationalIdType={chosenNationalIdType}
      />
    </>
  );
};

const FieldsByIdType: FC<{
  state: IdTypeFieldsProps["state"];
  chosenNationalIdType: IdType | undefined;
}> = ({ state, chosenNationalIdType }) => {
  const t = useTranslations();

  switch (chosenNationalIdType) {
    case "national_id":
      return (
        <>
          <Field
            state={state}
            name="applicant_id_number"
            label={t("ApplicantForm.nationalId")}
            required
            control={(props) => <Input {...props} />}
          />
        </>
      );

    case "birth_certificate":
      return (
        <>
          <Field
            state={state}
            name="birth_certificate_number"
            label={t("ApplicantForm.birthCertificateNumber")}
            required
            control={(props) => <Input {...props} />}
          />
          <Field
            state={state}
            name="birth_certificate_file"
            label={t("ApplicantForm.birthCertificateFile")}
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                {...props}
              />
            )}
          />
        </>
      );

    case "alien_id":
      return (
        <>
          <Field
            state={state}
            name="alien_id_number"
            label={t("ApplicantForm.alienId")}
            required
            control={(props) => <Input {...props} />}
          />

          <Field
            state={state}
            name="is_refugee"
            control={(props) => (
              <Checkbox {...props}>{t("ApplicantForm.isRefugee")}</Checkbox>
            )}
          />
        </>
      );

    default:
      return null;
  }
};
