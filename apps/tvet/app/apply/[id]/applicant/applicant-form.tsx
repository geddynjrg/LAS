"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applicantAction } from "@/app/apply/[id]/applicant/applicant-action";
import {
  applicantSchema,
  dummyCounties,
  dummyDisabilities,
  dummyDisabilityLevels,
  FILE_ACCEPT,
  MAX_FILE_SIZE,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { PhoneNumbersField } from "@/app/apply/[id]/phone-numbers-field";

export interface ApplicantFormProps {
  id: string;
  defaultValues?: Partial<ApplicantSchema>;
}

export const ApplicantForm: FC<ApplicantFormProps> = ({
  id,
  defaultValues,
}) => {
  const t = useTranslations("ApplicantForm");

  const nationalIdTypes = useMemo(
    () =>
      [
        { label: "National ID", value: "national-id" },
        { label: "Birth certificate", value: "birth-certificate" },
        { label: "Alien ID", value: "alien-id" },
      ] as const,
    [],
  );

  const [state, formAction, _isPending] = useForm(
    applicantAction,
    applicantSchema,
    defaultValues,
  );

  const [chosenNationalIdType, setChosenNationalIdType] =
    useState<(typeof nationalIdTypes)[number]["value"]>();

  const [isPersonWithDisabilities, setIsPersonWithDisabilities] = useState(
    state.values?.personWithDisabilities === "on",
  );

  const [chosenCounty, setChosenCounty] = useState(state.values?.county);

  const IdTypeFields = () => {
    switch (chosenNationalIdType) {
      case "national-id":
        return (
          <>
            <Field
              state={state}
              name="nationalId"
              label={t("nationalId")}
              required
              control={(props) => <Input {...props} />}
            />
          </>
        );

      case "birth-certificate":
        return (
          <>
            <Field
              state={state}
              name="birthCertificateNumber"
              label={t("birthCertificateNumber")}
              required
              control={(props) => <Input {...props} />}
            />
            <Field
              state={state}
              name="birthCertificateFile"
              label={t("birthCertificateFile")}
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

      case "alien-id":
        return (
          <>
            <Field
              state={state}
              name="alienId"
              label={t("alienId")}
              required
              control={(props) => <Input {...props} />}
            />

            <Field
              state={state}
              name="alienIdIsRefugee"
              control={(props) => (
                <Checkbox {...props}>{t("isRefugee")}</Checkbox>
              )}
            />
          </>
        );
    }
  };

  const DisabilitiesFields = () => {
    if (!isPersonWithDisabilities) {
      return null;
    }

    return (
      <>
        <Field
          state={state}
          name="natureOfDisability"
          label={t("natureOfDisability")}
          required
          control={(props) => <Select options={dummyDisabilities} {...props} />}
        />

        <Field
          state={state}
          name="disabilityCardNumber"
          label={t("disabilityCardNumber")}
          required
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="disabilityCardPicture"
          label={t("disabilityCardPicture")}
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
          name="disabilityLevel"
          label={t("disabilityLevel")}
          required
          control={(props) => (
            <Select options={dummyDisabilityLevels} {...props} />
          )}
        />

        <Field
          state={state}
          name="disabilityDescription"
          label={t("disabilityDescription")}
          required
          control={(props) => <Textarea {...props} />}
        />
      </>
    );
  };

  return (
    <ApplyFormWrap
      action={formAction}
      cancelUrl="/dashboard"
      className="space-y-4"
    >
      <ApplyFormSubtitle>{t("appicantInfo")}</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="firstName"
        label={t("firstName")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="middleName"
        label={t("middleName")}
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="surname"
        label={t("surname")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="sex"
        label={t("sex")}
        required
        control={(props) => (
          <ButtonGroup {...props} type="single">
            <ButtonGroupItem value="male">{t("male")}</ButtonGroupItem>
            <ButtonGroupItem value="female">{t("female")}</ButtonGroupItem>
            <ButtonGroupItem value="intersex">{t("intersex")}</ButtonGroupItem>
          </ButtonGroup>
        )}
      />

      <Field
        state={state}
        name="dateOfBirth"
        label={t("dateOfBirth")}
        required
        control={(props) => <DatePicker {...props} />}
      />

      <Field
        state={state}
        name="idType"
        label={t("idType")}
        required
        control={(props) => (
          <RadioGroup
            {...props}
            onValueChange={setChosenNationalIdType}
            options={nationalIdTypes}
          />
        )}
      />

      <IdTypeFields />

      <PhoneNumbersField state={state} />

      <Field
        state={state}
        name="email"
        label={t("email")}
        control={(props) => <Input type="email" {...props} />}
      />

      <Field
        state={state}
        name="personWithDisabilities"
        control={(props) => (
          <Checkbox {...props} onValueChange={setIsPersonWithDisabilities}>
            {t("personWithDisabilities")}
          </Checkbox>
        )}
      />

      <DisabilitiesFields />

      <ApplyFormSubtitle className="mt-8">{t("address")}</ApplyFormSubtitle>

      <Field
        state={state}
        name="county"
        label="County"
        required
        control={(props) => (
          <SearchInput
            {...props}
            onValueChange={setChosenCounty}
            placeholder={t("chooseOrSearch")}
            options={dummyCounties.map((county) => ({
              label: county.name,
              value: county.name,
            }))}
          />
        )}
      />

      <Field
        state={state}
        name="subCounty"
        label={t("subCounty")}
        required
        control={(props) => (
          <SearchInput
            {...props}
            placeholder={t("chooseOrSearch")}
            options={dummyCounties
              .find((county) => county.name === chosenCounty)
              ?.constituencies.map((c) => ({
                label: c,
                value: c,
              }))}
          />
        )}
      />

      <Field
        state={state}
        name="ward"
        label={t("ward")}
        required
        control={(props) => <Input placeholder={t("enterWard")} {...props} />}
      />
    </ApplyFormWrap>
  );
};
