"use client";

import { type FC } from "react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Field } from "@workspace/ui/components/form";
import { useForm } from "@workspace/ui/hooks/use-form";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { confirmationAction } from "@/app/apply/[id]/confirmation/confirmation-action";
import {
  confirmationSchema,
  type ConfirmationSchema,
} from "@/app/apply/[id]/confirmation/confirmation-schema";

export interface ConfirmationFormProps {
  id: string;
  defaultValues?: Partial<ConfirmationSchema>;
}

export const ConfirmationForm: FC<ConfirmationFormProps> = ({
  id,
  defaultValues,
}) => {
  const [state, formAction, _isPending] = useForm(
    confirmationAction,
    confirmationSchema,
    defaultValues,
  );

  return (
    <ApplyFormWrap action={formAction} prevUrl="course" className="space-y-4">
      <ApplyFormSubtitle>Confirmations</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="confirm_personal_information"
        control={(props) => (
          <Checkbox {...props}>
            I confirm that the personal information provided in this application
            is accurate and complete to the best of my knowledge. I understand
            that this data will be used for the purpose of my application,
            admission, and further communication regarding my studies.
          </Checkbox>
        )}
      />
      <Field
        state={state}
        name="confirm_eligibility"
        control={(props) => (
          <Checkbox {...props}>
            I confirm that I meet the eligibility requirements for the chosen
            course and will provide all necessary supporting documents as
            requested. I acknowledge that failure to do so may result in the
            rejection of my application or a delay in processing.
          </Checkbox>
        )}
      />
    </ApplyFormWrap>
  );
};
