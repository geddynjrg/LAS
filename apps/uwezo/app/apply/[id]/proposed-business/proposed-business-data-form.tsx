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
import {
  proposedBusinessDataSchema,
  type ProposedBusinessData,
} from "@/actions/apply-form/proposed-business-data-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";

export interface ProposedBusinessDataProps {
  id: string;
  action: FormAction<ProposedBusinessData>;
}

export const ProposedBusinessDataForm: FC<ProposedBusinessDataProps> = ({
  id,
  action,
}) => {
  const [state, formAction, isPending] = useForm(
    action,
    proposedBusinessDataSchema,
  );

  const prevUrl = `/apply/${id}/loan-conditions`;
  const nextUrl = `/apply/${id}/confirmations`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container>
        <FormCard title="Business information" className="space-y-4">
          <Field
            state={state}
            name="natureOfBusiness"
            label="Nature of business"
            required
            control={(props) => (
              <ButtonGroup {...props} type="single">
                <ButtonGroupItem value="Start-up">Start-up</ButtonGroupItem>
                <ButtonGroupItem value="Expansion">Expansion</ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <Field
            state={state}
            name="businessType"
            label="Business type"
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={[
                  { label: "Trade", value: "Trade" },
                  { label: "Service", value: "Service" },
                  { label: "Manufacturing", value: "Manufacturing" },
                  { label: "Agriculture", value: "Agriculture" },
                  { label: "Other", value: "Other" },
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="yearsInBusiness"
            label="Years in business"
            required
            control={(_props) => <Input placeholder="Enter years" type="tel" />}
          />
        </FormCard>

        <FormCard title="Business performance" className="space-y-4">
          <Field
            state={state}
            name="averageIncome"
            label="Average income per month"
            required
            control={(_props) => (
              <Input
                placeholder="Enter amount"
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="costOfGoods"
            label="Cost of goods/services per month"
            required
            control={(_props) => (
              <Input
                placeholder="Enter amount"
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="rentForBusiness"
            label="Rent for business"
            required
            control={(_props) => (
              <Input
                placeholder="Enter amount"
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="salaries"
            label="Salaries/wages for workers"
            required
            control={(_props) => (
              <Input
                placeholder="Enter amount"
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="transportForBusinessStock"
            label="Transport for business stock"
            required
            control={(_props) => (
              <Input
                placeholder="Enter amount"
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          {/* TODO: add the option to add custom field  */}
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
