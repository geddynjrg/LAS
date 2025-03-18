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

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { guardianAction } from "@/app/apply/[id]/guardian/guardian-action";
import {
  dummyCounties,
  dummyDisabilities,
  dummyDisabilityLevels,
  guardianRoles,
  guardianSchema,
  type GuardianSchema,
} from "@/app/apply/[id]/guardian/guardian-schema";

const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export interface GuardianFormProps {
  id: string;
  defaultValues?: Partial<GuardianSchema>;
}

export const GuardianForm: FC<GuardianFormProps> = ({ id, defaultValues }) => {
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
    guardianAction,
    guardianSchema,
    defaultValues,
  );

  const [guardianRole, setGuardianRole] =
    useState<(typeof guardianRoles)[number]["value"]>();

  const [chosenNationalIdType, setChosenNationalIdType] =
    useState<(typeof nationalIdTypes)[number]["value"]>();

  const [isSecondaryPhoneVisible, setIsSecondaryPhoneVisible] = useState(false);

  const GuardianRoleFields = () => {
    switch (guardianRole) {
      case "parent":
        return (
          <>
            <Field
              state={state}
              name="parentNationalId"
              label="National ID"
              required
              control={(props) => <Input {...props} />}
            />
          </>
        );

      case "grandparent":
        return (
          <>
            <Field
              state={state}
              name="grandparentBirthCertificateNumber"
              label="Birth Certificate Number"
              required
              control={(props) => <Input {...props} />}
            />
            <Field
              state={state}
              name="grandparentBirthCertificateFile"
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

      case "relative":
        return (
          <>
            <Field
              state={state}
              name="relativeAlienId"
              label="Alien ID"
              required
              control={(props) => <Input {...props} />}
            />

            <Field
              state={state}
              name="relativeAlienIdIsRefugee"
              control={(props) => <Checkbox {...props}>I am refugee</Checkbox>}
            />
          </>
        );
    }
  };

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

  return (
    <ApplyFormWrap
      action={formAction}
      prevUrl="applicant"
      className="space-y-4"
    >
      <ApplyFormSubtitle>Parent / guardian info</ApplyFormSubtitle>
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
        name="guardianRole"
        label="Role of the guardian"
        required
        control={(props) => (
          <RadioGroup
            {...props}
            onValueChange={setGuardianRole}
            options={guardianRoles}
          />
        )}
      />

      <GuardianRoleFields />

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
    </ApplyFormWrap>
  );
};
