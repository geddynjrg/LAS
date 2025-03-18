"use client";

import type { FC } from "react";

import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { Select } from "@workspace/ui/components/select";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applicantAction } from "@/app/apply/[id]/applicant/applicant-action";
import {
  applicantSchema,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";

export interface ApplicantFormProps {
  id: string;
  defaultValues?: Partial<ApplicantSchema>;
}

export const ApplicantForm: FC<ApplicantFormProps> = ({
  id,
  defaultValues,
}) => {
  const [state, formAction, isPending] = useForm(
    applicantAction,
    applicantSchema,
    defaultValues,
  );
  return (
    <ApplyFormWrap
      action={formAction}
      cancelUrl="/dashboard"
      className="space-y-4"
    >
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
        control={(props) => (
          <Select
            options={[
              { label: "Option 1", value: "1" },
              { label: "Option 2", value: "2" },
            ]}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="radioGroup"
        label="Radio group label"
        required
        control={(props) => (
          <RadioGroup
            {...props}
            options={[
              { label: "Option 1", value: "1" },
              { label: "Option 2", value: "2" },
              { label: "Option 3", value: "3" },
            ]}
          />
        )}
        description="This is a description for the radio group field"
      />
    </ApplyFormWrap>
  );
};
