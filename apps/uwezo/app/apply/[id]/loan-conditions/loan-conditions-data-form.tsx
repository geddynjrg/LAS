"use client";

import { IconCaretDownFilled, IconSearch } from "@tabler/icons-react";
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

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import {
  loanConditionsDataSchema,
  type LoanConditionsData,
} from "@/app/apply/[id]/loan-conditions/loan-conditions-schema";
import { LoanConditionsData as ApplicationLoanConditionsData } from "@/lib/data/application";

export interface LoanConditionsDataProps {
  id: string;
  action: FormAction<LoanConditionsData>;
  loanConditionsData?: ApplicationLoanConditionsData;
}

export const LoanConditionsDataForm: FC<LoanConditionsDataProps> = ({
  id,
  action,
  loanConditionsData,
}) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    action,
    loanConditionsDataSchema,
    {
      accountNumber: loanConditionsData?.accountNumber,
      bankBranch: loanConditionsData?.bankBranch,
      bankName: loanConditionsData?.bankName,
      loanAmount: loanConditionsData?.loanAmount,
      loanType: loanConditionsData?.loanType,
      purposeOfLoan: loanConditionsData?.purposeOfLoan,
      repaymentPeriod: loanConditionsData?.repaymentPeriod,
    },
  );

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
                options={[
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
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="loanType"
            label={t("ApplicationDetailsPage.loan.loanType")}
            required
            control={(props) => (
              <ButtonGroup {...props} type="single">
                <ButtonGroupItem value="Wezesha">Wezesha</ButtonGroupItem>
                <ButtonGroupItem value="Endeleza">Endeleza</ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <Card variant="blue" radius="sm">
            <p>{t("ApplicationDetailsPage.loan.LoanDescription")}</p>
            <br />
            <p className="font-bold">
              {t("ApplicationDetailsPage.loan.Interest")}
            </p>
          </Card>

          <Field
            state={state}
            name="loanAmount"
            label={t("ApplicationDetailsPage.loan.loanAmount")}
            required
            description={t("ApplicationDetailsPage.loan.maximumLoan")}
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
                thumbLabel={(value) => t("Common.monthCount", { count: value })}
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
              <SearchInput
                startDecorator={<IconSearch />}
                endDecorator={<IconCaretDownFilled />}
                placeholder={t("ApplicationDetailsPage.loan.selectBank")}
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
