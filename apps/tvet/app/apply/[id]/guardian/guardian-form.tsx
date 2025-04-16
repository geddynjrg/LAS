"use client";

import { useMemo, useState, type FC } from "react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { useForm } from "@workspace/ui/hooks/use-form";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { guardianAction } from "@/app/apply/[id]/guardian/guardian-action";
import {
  FILE_ACCEPT,
  guardianRoles,
  guardianSchema,
  MAX_FILE_SIZE,
  type GuardianSchema,
} from "@/app/apply/[id]/guardian/guardian-schema";
import { PhoneNumbersField } from "@/app/apply/[id]/phone-numbers-field";

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

  const [state, formAction, _isPending] = useForm(
    guardianAction,
    guardianSchema,
    defaultValues,
  );

  const [guardianRole, setGuardianRole] =
    useState<(typeof guardianRoles)[number]["value"]>();

  const [chosenNationalIdType, setChosenNationalIdType] =
    useState<(typeof nationalIdTypes)[number]["value"]>();

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
                  accept={FILE_ACCEPT}
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
        name="guardian_first_name"
        label="First Name"
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="guardian_middle_name"
        label="Middle Name"
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="guardian_surname"
        label="Surname"
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="guardian_role"
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

      <PhoneNumbersField state={state} />

      <Field
        state={state}
        name="email"
        label="Email"
        control={(props) => <Input type="email" {...props} />}
      />
    </ApplyFormWrap>
  );
};
