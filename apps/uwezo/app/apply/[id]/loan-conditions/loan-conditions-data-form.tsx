"use client";

import { useTranslations } from "next-intl";
import { useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import { Container } from "@workspace/ui/components/container";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { Slider } from "@workspace/ui/components/slider";
import { Card } from "@workspace/ui/components/uwezo/card";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import {
  loanConditionsDataSchema,
  type LoanConditionsData,
} from "@/app/apply/[id]/loan-conditions/loan-conditions-schema";
import type { TaxonomyOption } from "@/lib/api/taxonomy.service";
import { LoanConditionsData as ApplicationLoanConditionsData } from "@/lib/data/application";

export interface LoanConditionsDataProps {
  id: string;
  action: FormAction<LoanConditionsData>;
  loanConditionsData?: ApplicationLoanConditionsData;
  taxonomyOptions?: {
    bankName: TaxonomyOption[];
    purposeOfLoan: TaxonomyOption[];
    loanType: TaxonomyOption[];
  };
}

export const LoanConditionsDataForm: FC<LoanConditionsDataProps> = ({
  id,
  action,
  loanConditionsData,
  taxonomyOptions,
}) => {
  const t = useTranslations();

  const [state, formAction, isPending] = useForm(
    action,
    loanConditionsDataSchema,
    {
      accountNumber: loanConditionsData?.accountNumber,
      bankBranch: loanConditionsData?.bankBranch,
      bankName: loanConditionsData?.bankName,
      bankNameOther: loanConditionsData?.bankNameOther,
      loanAmount: loanConditionsData?.loanAmount,
      loanType: loanConditionsData?.loanType,
      purposeOfLoan: loanConditionsData?.purposeOfLoan,
      repaymentPeriod: loanConditionsData?.repaymentPeriod,
    },
  );

  const [selectedType, setSelectedType] = useState<
    keyof typeof loanTypes | undefined
  >(state.values?.loanType as keyof typeof loanTypes);

  const [selectedBankName, setSelectedBankName] = useState(
    state.values?.bankName,
  );

  const loanTypes = {
    Endeleza: {
      title: "Endeleza",
      maxLoanAmount: "500 000",
      content: {
        title: t("ApplicationDetailsPage.loan.LoanDescriptionEndeleza"),
        underText: t("ApplicationDetailsPage.loan.Interest"),
      },
    },
    Wezesha: {
      title: "Wezesha",
      maxLoanAmount: "100 000",
      content: {
        title: t("ApplicationDetailsPage.loan.LoanDescriptionWezesha"),
        underText: t("ApplicationDetailsPage.loan.Interest"),
      },
    },
  };

  const maxAmount = selectedType
    ? loanTypes[selectedType]?.maxLoanAmount
    : undefined;

  const prevUrl = `/apply/${id}/members`;
  const nextUrl = `/apply/${id}/proposed-business`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container className="space-y-8">
        <FormCard
          title={t("ApplicationDetailsPage.loan.loanDetails")}
          className="space-y-4"
        >
          <Field
            state={state}
            name="purposeOfLoan"
            label={t("ApplicationDetailsPage.loan.purposeOfTheLoan")}
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={
                  taxonomyOptions?.purposeOfLoan || [
                    {
                      label: t(
                        "ApplicationDetailsPage.groupData.groupBackground.tableBanking",
                      ),
                      value: "Table banking",
                    },
                    {
                      label: t(
                        "ApplicationDetailsPage.groupData.groupBackground.commonGroupProject",
                      ),
                      value: "Common group project",
                    },
                  ]
                }
              />
            )}
          />

          <Field
            state={state}
            name="loanType"
            label={t("ApplicationDetailsPage.loan.loanType")}
            required
            control={(props) => (
              <ButtonGroup
                {...props}
                type="single"
                onValueChange={(val) =>
                  setSelectedType(val as keyof typeof loanTypes)
                }
              >
                <ButtonGroupItem value={loanTypes.Wezesha.title}>
                  {loanTypes.Wezesha.title}
                </ButtonGroupItem>
                <ButtonGroupItem value={loanTypes.Endeleza.title}>
                  {loanTypes.Endeleza.title}
                </ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          {selectedType === loanTypes.Wezesha.title && (
            <Card variant="blue" radius="sm">
              <p>{loanTypes.Wezesha.content.title}</p>
              <br />
              <p className="font-bold">{loanTypes.Wezesha.content.underText}</p>
            </Card>
          )}

          {selectedType === loanTypes.Endeleza.title && (
            <Card variant="blue" radius="sm">
              <p>{loanTypes.Endeleza.content.title}</p>
              <br />
              <p className="font-bold">{loanTypes.Wezesha.content.underText}</p>
            </Card>
          )}

          <Field
            state={state}
            name="loanAmount"
            label={t("ApplicationDetailsPage.loan.loanAmount")}
            required
            description={
              maxAmount
                ? t("ApplicationDetailsPage.loan.maximumLoan", {
                    count: maxAmount,
                  })
                : ""
            }
            control={(props) => (
              <Input
                {...props}
                endDecorator="KSh"
                defaultValue={props.defaultValue?.toString()}
              />
            )}
          />

          <Field
            state={state}
            name="repaymentPeriod"
            label={t("ApplicationDetailsPage.loan.repaymentPeriod")}
            required
            control={(props) => (
              <Slider
                startDecorator={t("Common.monthCount", { count: 1 })}
                endDecorator={t("Common.monthCount", { count: 12 })}
                thumbLabel={(value) =>
                  value ? t("Common.monthCount", { count: value }) : undefined
                }
                {...props}
                min={1}
                max={12}
              />
            )}
          />
        </FormCard>

        <FormCard
          title={t("ApplicationDetailsPage.loan.bankAccountDetails")}
          className="space-y-4"
        >
          <Field
            state={state}
            name="bankName"
            label={t("ApplicationDetailsPage.loan.bankName")}
            required
            control={(props) => (
              <RadioGroup
                {...props}
                onValueChange={(val) => setSelectedBankName(val)}
                options={
                  taxonomyOptions?.bankName || [
                    { label: "Bank 1", value: "Bank 1" },
                    { label: "Better Bank", value: "Better Bank" },
                    { label: t("Common.other"), value: "Other" },
                  ]
                }
              />
            )}
          />

          {selectedBankName === "Other" && (
            <Field
              state={state}
              name="bankNameOther"
              required
              control={(props) => (
                <Input
                  {...props}
                  defaultValue={props.defaultValue ?? undefined}
                  placeholder={t("ApplicationDetailsPage.loan.bankName")}
                />
              )}
            />
          )}

          <Field
            state={state}
            name="bankBranch"
            label={t("ApplicationDetailsPage.loan.bankBranch")}
            required
            control={(props) => <Input {...props} />}
          />

          <Field
            state={state}
            name="accountNumber"
            label={t("ApplicationDetailsPage.loan.accountNumber")}
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
