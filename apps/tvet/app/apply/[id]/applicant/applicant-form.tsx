"use client";

import { IconPlus } from "@tabler/icons-react";
import { useMemo, useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, FieldGroup } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Underline } from "@workspace/ui/components/underline";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applicantAction } from "@/app/apply/[id]/applicant/applicant-action";
import {
  applicantSchema,
  dummyCounties,
  dummyDisabilities,
  dummyDisabilityLevels,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export interface ApplicantFormProps {
  id: string;
  defaultValues?: Partial<ApplicantSchema>;
}

export const ApplicantForm: FC<ApplicantFormProps> = ({
  id,
  defaultValues,
}) => {
  const nationalIdTypes = useMemo(
    () =>
      [
        { label: "National ID", value: "national-id" },
        { label: "Birth certificate", value: "birth-certificate" },
        { label: "Alien ID", value: "alien-id" },
      ] as const,
    [],
  );

  const [state, formAction, isPending] = useForm(
    applicantAction,
    applicantSchema,
    defaultValues,
  );

  const [chosenNationalIdType, setChosenNationalIdType] =
    useState<(typeof nationalIdTypes)[number]["value"]>();

  const [isSecondaryPhoneVisible, setIsSecondaryPhoneVisible] = useState(false);
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
              label="National ID"
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
              label="Birth Certificate Number"
              required
              control={(props) => <Input {...props} />}
            />
            <Field
              state={state}
              name="birthCertificateFile"
              label="Birth Certificate"
              required
              control={(props) => (
                <FileUploadInput
                  accept={{
                    "image/*": [".jpg", ".png"],
                    "application/pdf": [".pdf"],
                  }}
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
              label="Alien ID"
              required
              control={(props) => <Input {...props} />}
            />

            <Field
              state={state}
              name="alienIdIsRefugee"
              control={(props) => <Checkbox {...props}>I am refugee</Checkbox>}
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
          label="Nature of disability"
          required
          control={(props) => <Select options={dummyDisabilities} {...props} />}
        />

        <Field
          state={state}
          name="disabilityCardNumber"
          label="Disability Card Number"
          required
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="disabilityCardPicture"
          label="Disability Card Picture"
          required
          control={(props) => (
            <FileUploadInput
              accept={{
                "image/*": [".jpg", ".png"],
                "application/pdf": [".pdf"],
              }}
              maxSize={MAX_FILE_SIZE}
              {...props}
            />
          )}
        />

        <Field
          state={state}
          name="disabilityLevel"
          label="Level of disability"
          required
          control={(props) => (
            <Select options={dummyDisabilityLevels} {...props} />
          )}
        />

        <Field
          state={state}
          name="disabilityDescription"
          label="Description of requirements (learning aids, medication, etc.)"
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
      <ApplyFormSubtitle>Applicant info</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="firstName"
        label="First Name"
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="middleName"
        label="Middle Name"
        description="This is the middle name"
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="surname"
        label="Surname"
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="sex"
        label="Sex"
        required
        control={(props) => (
          <ButtonGroup {...props} type="single">
            <ButtonGroupItem value="male">Male</ButtonGroupItem>
            <ButtonGroupItem value="female">Female</ButtonGroupItem>
            <ButtonGroupItem value="intersex">Intersex</ButtonGroupItem>
          </ButtonGroup>
        )}
      />

      <Field
        state={state}
        name="dateOfBirth"
        label="Date of birth"
        required
        control={(props) => <DatePicker {...props} />}
      />

      <Field
        state={state}
        name="idType"
        label="Which form of ID do you have?"
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

      <FieldGroup
        label="Phone Number"
        required
        description={
          isSecondaryPhoneVisible ? null : (
            <Underline asChild className="typo-body-medium">
              <button
                type="button"
                onClick={() => setIsSecondaryPhoneVisible(true)}
              >
                <IconPlus className="mr-1" /> Add another phone number
              </button>
            </Underline>
          )
        }
      >
        <Field
          state={state}
          name="callingCode"
          className="max-w-40"
          required
          control={(props) => <CallingCodeSelect {...props} />}
        />
        <Field
          state={state}
          name="phone"
          required
          control={(props) => <Input type="tel" {...props} />}
        />
      </FieldGroup>

      {isSecondaryPhoneVisible && (
        <FieldGroup label="Secondary Phone Number" required>
          <Field
            state={state}
            name="secondaryCallingCode"
            className="max-w-40"
            required
            control={(props) => <CallingCodeSelect {...props} />}
          />
          <Field
            state={state}
            name="secondaryPhone"
            required
            control={(props) => <Input type="tel" {...props} />}
          />
        </FieldGroup>
      )}

      <Field
        state={state}
        name="email"
        label="Email"
        control={(props) => <Input type="email" {...props} />}
      />

      <Field
        state={state}
        name="personWithDisabilities"
        control={(props) => (
          <Checkbox {...props} onValueChange={setIsPersonWithDisabilities}>
            Person with disabilities
          </Checkbox>
        )}
      />

      <DisabilitiesFields />

      <ApplyFormSubtitle className="mt-8">Address</ApplyFormSubtitle>

      <Field
        state={state}
        name="county"
        label="County"
        required
        control={(props) => (
          <SearchInput
            {...props}
            onValueChange={setChosenCounty}
            placeholder="Choose or search"
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
        label="Subcounty"
        required
        control={(props) => (
          <SearchInput
            {...props}
            placeholder="Choose or search"
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
        label={"Ward"}
        required
        control={(props) => <Input placeholder="Enter ward" {...props} />}
      />
    </ApplyFormWrap>
  );
};
