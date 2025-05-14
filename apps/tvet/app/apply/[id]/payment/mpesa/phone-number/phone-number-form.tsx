"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import {
  Field,
  FieldGroup,
  Form,
  SubmitButton,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { initiatePaymentAction } from "@/app/apply/[id]/payment/mpesa/initiate-payment-action";
import { initiatePaymentSchema } from "@/app/apply/[id]/payment/mpesa/initiate-payment-schema";

export interface MpesaPaymentFormProps {
  id: string;
}

export const MpesaPaymentForm: FC<MpesaPaymentFormProps> = ({ id }) => {
  const t = useTranslations("MpesaPayment");
  const [state, formAction, isPending] = useForm(
    initiatePaymentAction,
    initiatePaymentSchema,
  );

  return (
    <Form action={formAction} className="space-y-4">
      {state.message && <Alert variant="error">{state.message}</Alert>}

      <input type="hidden" name="id" value={id} />
      <FieldGroup label="Phone Number" description="Enter your phone number">
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

      <SubmitButton disabled={isPending}>{t("payButton")}</SubmitButton>
    </Form>
  );
};
