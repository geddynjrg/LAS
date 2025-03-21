"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    action,
    proposedBusinessDataSchema,
  );

  const prevUrl = `/apply/${id}/loan-conditions`;
  const nextUrl = `/apply/${id}/confirmations`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container>
        <FormCard
          title={t(
            "ApplicationDetailsPage.proposedBusiness.businessInfo.businessInformation",
          )}
          className="space-y-4"
        >
          <Field
            state={state}
            name="natureOfBusiness"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessInfo.natureOfBusiness",
            )}
            required
            control={(props) => (
              <ButtonGroup {...props} type="single">
                <ButtonGroupItem value="Start-up">
                  {t(
                    "ApplicationDetailsPage.proposedBusiness.businessInfo.startup",
                  )}
                </ButtonGroupItem>
                <ButtonGroupItem value="Expansion">
                  {t(
                    "ApplicationDetailsPage.proposedBusiness.businessInfo.expansion",
                  )}
                </ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <Field
            state={state}
            name="businessType"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessInfo.businessType",
            )}
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={[
                  { label: t("Common.trade"), value: "Trade" },
                  { label: t("Common.service"), value: "Service" },
                  { label: t("Common.manufacturing"), value: "Manufacturing" },
                  { label: t("Common.agriculture"), value: "Agriculture" },
                  { label: t("Common.other"), value: "Other" },
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="yearsInBusiness"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessInfo.yearsInBusiness",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessInfo.enterYears",
                )}
                type="tel"
              />
            )}
          />
        </FormCard>

        <FormCard
          title={t(
            "ApplicationDetailsPage.proposedBusiness.businessPerformance.businessPerformance",
          )}
          className="space-y-4"
        >
          <Field
            state={state}
            name="averageIncome"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessPerformance.averageIncomePerMonth",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                )}
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="costOfGoods"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessPerformance.goodsServicesCost",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                )}
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="rentForBusiness"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessPerformance.rendForBusiness",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                )}
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="salaries"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessPerformance.salaries",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                )}
                type="tel"
                startDecorator="KES"
              />
            )}
          />

          <Field
            state={state}
            name="transportForBusinessStock"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessPerformance.transportCosts",
            )}
            required
            control={(_props) => (
              <Input
                placeholder={t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                )}
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
