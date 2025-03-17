"use client";

import type { FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import { Container } from "@workspace/ui/components/container";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Slider } from "@workspace/ui/components/slider";
import { Card } from "@workspace/ui/components/uwezo/card";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

import {
  loanConditionsDataSchema,
  type LoanConditionsData,
} from "@/actions/apply-form/loan-conditions-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";

export interface LoanConditionsDataProps {
  id: string;
  action: FormAction<LoanConditionsData>;
}

export const LoanConditionsDataForm: FC<LoanConditionsDataProps> = ({
  id,
  action,
}) => {
  const [state, formAction, isPending] = useForm(
    action,
    loanConditionsDataSchema,
  );

  const prevUrl = `/apply/${id}/members`;
  const nextUrl = `/apply/${id}/proposed-business`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container>
        <FormCard title="Loan Details" className="space-y-4">
          <Field
            state={state}
            name="purposeOfLoan"
            label="Purpose of the loan"
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={[
                  { label: "Table banking", value: "Table banking" },
                  {
                    label: "Common group project",
                    value: "Common group project",
                  },
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="loanType"
            label="Loan type"
            required
            control={(props) => (
              <ButtonGroup {...props} type="single">
                <ButtonGroupItem value="Wezesha">Wezesha</ButtonGroupItem>
                <ButtonGroupItem value="Endeleza">Endeleza</ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <Card variant="blue" radius="sm">
            <p>
              Wezesha is for first time borrowers. Loan amount range is 50 000
              KSh - 100 000 KSh. Maximum repayment period is 24 months.
            </p>
            <br />
            <p className="font-bold">The loan has a 1% interest rate</p>
          </Card>

          <Field
            state={state}
            name="loanAmount"
            label="Loan amount"
            required
            description="Maximum amount is 100 000 KSh"
            control={(props) => <Input type="tel" endDecorator="KSh" />}
          />

          <Field
            state={state}
            name="repaymentPeriod"
            label="Proposed repayment period in months"
            required
            control={(props) => (
              <Slider
                startDecorator="1 month"
                endDecorator="12 months"
                thumbLabel={(value) => `${value} months`} // fix in post AKA translations
                {...props}
                min={1}
                max={12}
              />
            )}
          />
        </FormCard>

        <FormCard title="Bank account details" className="space-y-4">
          <Field
            state={state}
            name="bankName"
            label="Bank name"
            required
            control={(props) => (
              <SearchInput
                {...props}
                options={[
                  { label: "bank 1", value: "bank 1" },
                  { label: "Better bank", value: "Better bank" },
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="bankBranch"
            label="Bank branch"
            required
            control={(props) => <Input {...props} />}
          />

          <Field
            state={state}
            name="accountNumber"
            label="Account number"
            required
            control={(props) => <Input {...props} />}
          />
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />

      <input type="hidden" name="redirectTo" value={nextUrl} />

      <ApplyFormActionBar
        disabled={isPending}
        nextUrl={nextUrl}
        prevUrl={prevUrl}
      />
    </Form>
  );
};
