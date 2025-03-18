"use client";

import { type FC } from "react";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Field } from "@workspace/ui/components/form";
import { useForm } from "@workspace/ui/hooks/use-form";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { confirmationsAction } from "@/app/apply/[id]/confirmations/confirmations-action";
import {
  confirmationsSchema,
  type ConfirmationsSchema,
} from "@/app/apply/[id]/confirmations/confirmations-schema";

const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export interface ConfirmationsFormProps {
  id: string;
  defaultValues?: Partial<ConfirmationsSchema>;
}

export const ConfirmationsForm: FC<ConfirmationsFormProps> = ({
  id,
  defaultValues,
}) => {
  const [state, formAction, isPending] = useForm(
    confirmationsAction,
    confirmationsSchema,
    defaultValues,
  );

  return (
    <ApplyFormWrap action={formAction} prevUrl="course" className="space-y-4">
      <ApplyFormSubtitle>Confirmations</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="confirmPersonalInformation"
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
        name="confirmEligibilityRequirements"
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
