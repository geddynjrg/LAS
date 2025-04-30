"use client";

import { type FC } from "react";

import { Field } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { useForm } from "@workspace/ui/hooks/use-form";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { guardianAction } from "@/app/apply/[id]/guardian/guardian-action";
import {
  guardianRoles,
  guardianSchema,
  type GuardianSchema,
} from "@/app/apply/[id]/guardian/guardian-schema";
import { IdTypeFields } from "@/app/apply/[id]/id-type-fields";
import { PhoneNumbersField } from "@/app/apply/[id]/phone-numbers-field";

export interface GuardianFormProps {
  id: string;
  prevStep?: string;
  defaultValues?: Partial<GuardianSchema>;
}

export const GuardianForm: FC<GuardianFormProps> = ({
  id,
  prevStep,
  defaultValues,
}) => {
  const [state, formAction, _isPending] = useForm(
    guardianAction,
    guardianSchema,
    defaultValues,
  );

  return (
    <ApplyFormWrap action={formAction} prevUrl={prevStep} className="space-y-4">
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
        control={(props) => <RadioGroup {...props} options={guardianRoles} />}
      />

      <IdTypeFields state={state} />

      <PhoneNumbersField state={state} />

      <Field
        state={state}
        name="guardian_email"
        label="Email"
        control={(props) => <Input type="email" {...props} />}
      />
    </ApplyFormWrap>
  );
};
