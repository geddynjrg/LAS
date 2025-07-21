"use client";

import { IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Underline } from "@workspace/ui/components/underline";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import {
  proposedBusinessDataSchema,
  type ProposedBusinessData,
} from "@/app/apply/[id]/proposed-business/proposed-business-data-schema";
import type { TaxonomyOption } from "@/lib/api/taxonomy.service";
import { ProposedBusinessData as ApplicationProposedBusinessData } from "@/lib/data/application";
import { parseNumber } from "@/lib/util";

export interface ProposedBusinessDataProps {
  id: string;
  action: FormAction<ProposedBusinessData>;
  applicationBusinessData?: ApplicationProposedBusinessData;
  taxonomyOptions?: {
    businessType: TaxonomyOption[];
  };
}

export const ProposedBusinessDataForm: FC<ProposedBusinessDataProps> = ({
  id,
  action,
  applicationBusinessData,
  taxonomyOptions,
}) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(
    action,
    proposedBusinessDataSchema,
    {
      averageIncome: applicationBusinessData?.averageIncome,
      businessType: applicationBusinessData?.businessType,
      costOfGoods: applicationBusinessData?.costOfGoods,
      natureOfBusiness: applicationBusinessData?.natureOfBusiness,
      rentForBusiness: applicationBusinessData?.rentForBusiness,
      salaries: applicationBusinessData?.salaries,
      transportForBusinessStock:
        applicationBusinessData?.transportForBusinessStock,
      yearsInBusiness: applicationBusinessData?.yearsInBusiness,
    },
  );

  const [averageIncome, setAverageIncome] = useState(
    state.values?.averageIncome,
  );

  const [costOfGoods, setCostOfGoods] = useState(state.values?.costOfGoods);

  const [rentForBusiness, setRentForBusiness] = useState(
    state.values?.rentForBusiness,
  );

  const [salaries, setSalaries] = useState(state.values?.salaries);

  const [transportForBusinessStock, setTransportForBusinessStock] = useState(
    state.values?.transportForBusinessStock,
  );

  const [surplusDeficit, setSurplusDeficit] = useState(
    (averageIncome ?? 0) -
      (costOfGoods ?? 0) -
      (rentForBusiness ?? 0) -
      (salaries ?? 0) -
      (transportForBusinessStock ?? 0),
  );

  useEffect(() => {
    setSurplusDeficit(
      (averageIncome ?? 0) -
        (costOfGoods ?? 0) -
        (rentForBusiness ?? 0) -
        (salaries ?? 0) -
        (transportForBusinessStock ?? 0),
    );
  }, [
    averageIncome,
    rentForBusiness,
    salaries,
    transportForBusinessStock,
    costOfGoods,
  ]);

  const prevUrl = `/apply/${id}/loan-conditions`;
  const nextUrl = `/apply/${id}/confirmations`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container className="space-y-8">
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
              <ButtonGroup {...props} type="single" className="flex flex-row">
                <ButtonGroupItem value="Start-up" className="grow px-1">
                  {t(
                    "ApplicationDetailsPage.proposedBusiness.businessInfo.startup",
                  )}
                </ButtonGroupItem>
                <ButtonGroupItem value="Expansion" className="grow px-1">
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
                options={
                  taxonomyOptions?.businessType || [
                    { label: t("Common.trade"), value: "Trade" },
                    { label: t("Common.service"), value: "Service" },
                    {
                      label: t("Common.manufacturing"),
                      value: "Manufacturing",
                    },
                    { label: t("Common.agriculture"), value: "Agriculture" },
                    { label: t("Common.other"), value: "Other" },
                  ]
                }
              />
            )}
          />

          <Field
            state={state}
            name="yearsInBusiness"
            label={t(
              "ApplicationDetailsPage.proposedBusiness.businessInfo.operationPeriod",
            )}
            required
            control={(props) => (
              <Input
                defaultValue={props.defaultValue?.toString()}
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
          <div className="grid gap-4">
            <h2 className="typo-h5">
              {t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.income",
              )}
            </h2>
            <Field
              state={state}
              name="averageIncome"
              label={t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.averageIncomePerMonth",
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) =>
                    setAverageIncome(parseNumber(value))
                  }
                />
              )}
            />
          </div>
          <div className="grid gap-4 border-t border-neutral-400">
            <h2 className="typo-h5 pt-4">
              {t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.expenses",
              )}
            </h2>
            <Field
              state={state}
              name="costOfGoods"
              label={t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.costOfGoods",
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) => {
                    setCostOfGoods(parseNumber(value));
                  }}
                />
              )}
            />

            <Field
              state={state}
              name="rentForBusiness"
              label={t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.rent",
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) =>
                    setRentForBusiness(parseNumber(value))
                  }
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
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) => setSalaries(parseNumber(value))}
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
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    "ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount",
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) =>
                    setTransportForBusinessStock(parseNumber(value))
                  }
                />
              )}
            />

            {/* TODO: add the option to add custom field, currently missing design */}
            {/* TODO: Look into how to use button here, currently button ghost adds unneeded styles */}
            <Underline className="border-b-primary text-primary hover:text-primary hover:cursor-pointer">
              <IconPlus className="!text-primary" size={20} />
              <p className="typo-body-medium">
                {t(
                  "ApplicationDetailsPage.proposedBusiness.businessPerformance.addCustomField",
                )}
              </p>
            </Underline>
          </div>

          <div className="overflow-hidden border-t border-neutral-400">
            <h2 className="typo-h5 py-4">
              {t(
                "ApplicationDetailsPage.proposedBusiness.businessPerformance.netSurplus",
              )}
            </h2>
            <Currency
              amount={surplusDeficit}
              currency="KES"
              signDisplay="always"
            />
          </div>
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
