"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("ApplyForm");
  const [state, formAction, isPending] = useForm(
    confirmationAction,
    confirmationSchema,
    defaultValues,
  );

  return (
    <ApplyFormWrap
      action={formAction}
      prevUrl="course"
      isPending={isPending}
      className="space-y-4"
    >
      <ApplyFormSubtitle>{t("confirmationTitle")}</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="confirm_personal_information"
        control={(props) => (
          <Checkbox {...props}>{t("confirmPersonalInformation")}</Checkbox>
        )}
      />
      <Field
        state={state}
        name="confirm_eligibility"
        control={(props) => (
          <Checkbox {...props}>{t("confirmEligibility")}</Checkbox>
        )}
      />
    </ApplyFormWrap>
  );
};
