"use client";

import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, type FormFieldState } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";

import {
  disabilityLevel,
  disabilityNature,
  FILE_ACCEPT,
  MAX_FILE_SIZE,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";

export interface DisabilitiesFieldsProps {
  state: FormFieldState<
    Pick<
      ApplicantSchema,
      | "applicant_disability"
      | "disability_nature"
      | "disability_card_number"
      | "disability_card_picture"
      | "disability_level"
      | "disability_requirements"
    >
  >;
}

export const DisabilitiesFields: FC<DisabilitiesFieldsProps> = ({ state }) => {
  const t = useTranslations();

  const [isPersonWithDisabilities, setIsPersonWithDisabilities] = useState(
    !!state.values?.applicant_disability,
  );

  const disabilities = Object.values(disabilityNature.Values).map((value) => ({
    label: t(`DisabilityNature.${value}`),
    value,
  }));

  const disabilityLevels = Object.values(disabilityLevel.Values).map(
    (value) => ({
      label: t(`DisabilityLevel.${value}`),
      value,
    }),
  );

  return (
    <>
      <Field
        state={state}
        name="applicant_disability"
        control={(props) => (
          <Checkbox {...props} onValueChange={setIsPersonWithDisabilities}>
            {t("ApplyForm.personWithDisabilities")}
          </Checkbox>
        )}
      />

      {isPersonWithDisabilities && (
        <>
          <Field
            state={state}
            name="disability_nature"
            label={t("ApplyForm.natureOfDisability")}
            required
            control={(props) => <Select options={disabilities} {...props} />}
          />

          <Field
            state={state}
            name="disability_card_number"
            label={t("ApplyForm.disabilityCardNumber")}
            required
            control={(props) => <Input {...props} />}
          />

          <Field
            state={state}
            name="disability_card_picture"
            label={t("ApplyForm.disabilityCardPicture")}
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="disability_level"
            label={t("ApplyForm.disabilityLevel")}
            required
            control={(props) => (
              <Select options={disabilityLevels} {...props} />
            )}
          />

          <Field
            state={state}
            name="disability_requirements"
            label={t("ApplyForm.disabilityDescription")}
            control={(props) => <Textarea {...props} />}
          />
        </>
      )}
    </>
  );
};
