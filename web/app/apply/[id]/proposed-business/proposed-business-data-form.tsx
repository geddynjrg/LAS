'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  type ProposedBusinessData,
  proposedBusinessFormSchema,
} from '@/app/apply/[id]/proposed-business/proposed-business-data-schema';
import type { TaxonomyOption } from '@/lib/api/taxonomy.service';
import { ProposedBusinessData as ApplicationProposedBusinessData } from '@/lib/data/application';
import { parseNumber } from '@/lib/util';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import {
  ButtonGroup,
  ButtonGroupItem,
} from '@workspace/ui/components/button-group';
import { CheckboxGroup } from '@workspace/ui/components/checkbox-group';
import { Container } from '@workspace/ui/components/container';
import { Currency } from '@workspace/ui/components/currency';
import { Field, Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Underline } from '@workspace/ui/components/underline';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

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
    proposedBusinessFormSchema,
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
      customExpenses: applicationBusinessData?.customExpenses,
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

  const [customExpenses, setCustomExpenses] = useState<
    { name: string; amount: number }[]
  >(applicationBusinessData?.customExpenses || []);

  const [surplusDeficit, setSurplusDeficit] = useState(
    (averageIncome ?? 0) -
      (costOfGoods ?? 0) -
      (rentForBusiness ?? 0) -
      (salaries ?? 0) -
      (transportForBusinessStock ?? 0) -
      customExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  useEffect(() => {
    const customExpensesTotal = customExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    setSurplusDeficit(
      (averageIncome ?? 0) -
        (costOfGoods ?? 0) -
        (rentForBusiness ?? 0) -
        (salaries ?? 0) -
        (transportForBusinessStock ?? 0) -
        customExpensesTotal,
    );
  }, [
    averageIncome,
    rentForBusiness,
    salaries,
    transportForBusinessStock,
    costOfGoods,
    customExpenses,
  ]);

  const prevUrl = `/apply/${id}/loan-conditions`;
  const nextUrl = `/apply/${id}/confirmations`;

  return (
    <Form
      action={formAction}
      className="grow-1 flex flex-col justify-between space-y-6"
      autoComplete="on"
    >
      <Container className="space-y-8">
        <FormCard
          title={t(
            'ApplicationDetailsPage.proposedBusiness.businessInfo.businessInformation',
          )}
          className="space-y-4"
        >
          <Field
            state={state}
            name="natureOfBusiness"
            label={t(
              'ApplicationDetailsPage.proposedBusiness.businessInfo.natureOfBusiness',
            )}
            required
            control={(props) => (
              <ButtonGroup {...props} type="single" className="flex flex-row">
                <ButtonGroupItem value="Start-up" className="grow px-1">
                  {t(
                    'ApplicationDetailsPage.proposedBusiness.businessInfo.startup',
                  )}
                </ButtonGroupItem>
                <ButtonGroupItem value="Expansion" className="grow px-1">
                  {t(
                    'ApplicationDetailsPage.proposedBusiness.businessInfo.expansion',
                  )}
                </ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <Field
            state={state}
            name="businessType"
            label={t(
              'ApplicationDetailsPage.proposedBusiness.businessInfo.businessType',
            )}
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={
                  taxonomyOptions?.businessType || [
                    { label: t('Common.trade'), value: 'Trade' },
                    { label: t('Common.service'), value: 'Service' },
                    {
                      label: t('Common.manufacturing'),
                      value: 'Manufacturing',
                    },
                    { label: t('Common.agriculture'), value: 'Agriculture' },
                    { label: t('Common.other'), value: 'Other' },
                  ]
                }
              />
            )}
          />

          <Field
            state={state}
            name="yearsInBusiness"
            label={t(
              'ApplicationDetailsPage.proposedBusiness.businessInfo.operationPeriod',
            )}
            required
            control={(props) => (
              <Input
                defaultValue={props.defaultValue?.toString()}
                placeholder={t(
                  'ApplicationDetailsPage.proposedBusiness.businessInfo.enterYears',
                )}
                type="tel"
              />
            )}
          />
        </FormCard>

        <FormCard
          title={t(
            'ApplicationDetailsPage.proposedBusiness.businessPerformance.businessPerformance',
          )}
          className="space-y-4"
        >
          <div className="grid gap-4">
            <h2 className="typo-h5">
              {t(
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.income',
              )}
            </h2>
            <Field
              state={state}
              name="averageIncome"
              label={t(
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.averageIncomePerMonth',
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
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
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.expenses',
              )}
            </h2>
            <Field
              state={state}
              name="costOfGoods"
              label={t(
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.costOfGoods',
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
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
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.rent',
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
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
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.salaries',
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
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
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.transportCosts',
              )}
              required
              control={(props) => (
                <Input
                  defaultValue={props.defaultValue?.toString()}
                  placeholder={t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
                  )}
                  type="tel"
                  endDecorator="KES"
                  onValueChange={(value) =>
                    setTransportForBusinessStock(parseNumber(value))
                  }
                />
              )}
            />

            {/* Custom Expenses */}
            {customExpenses.map((expense, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field
                    name={`customExpense-${index}-name`}
                    label={t(
                      'ApplicationDetailsPage.proposedBusiness.businessPerformance.expenseName',
                    )}
                    control={(props) => (
                      <Input
                        {...props}
                        value={expense.name}
                        onValueChange={(value) => {
                          const updatedExpenses = [...customExpenses];
                          updatedExpenses[index] = { ...expense, name: value };
                          setCustomExpenses(updatedExpenses);
                        }}
                        placeholder={t(
                          'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterExpenseName',
                        )}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Field
                    name={`customExpense-${index}-amount`}
                    label={t(
                      'ApplicationDetailsPage.proposedBusiness.businessPerformance.amount',
                    )}
                    control={(props) => (
                      <Input
                        {...props}
                        defaultValue={expense.amount.toString()}
                        type="tel"
                        endDecorator="KES"
                        onValueChange={(value) => {
                          const updatedExpenses = [...customExpenses];
                          updatedExpenses[index] = {
                            ...expense,
                            amount: parseNumber(value),
                          };
                          setCustomExpenses(updatedExpenses);
                        }}
                        placeholder={t(
                          'ApplicationDetailsPage.proposedBusiness.businessPerformance.enterAmount',
                        )}
                      />
                    )}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const updatedExpenses = customExpenses.filter(
                      (_, i) => i !== index,
                    );
                    setCustomExpenses(updatedExpenses);
                  }}
                  className="mt-6 p-2"
                >
                  <IconTrash className="text-destructive" size={20} />
                </Button>
              </div>
            ))}

            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setCustomExpenses([...customExpenses, { name: '', amount: 0 }]);
              }}
              className="flex items-center gap-2 p-0"
            >
              <Underline className="border-b-primary text-primary hover:text-primary hover:cursor-pointer">
                <IconPlus className="!text-primary" size={20} />
                <p className="typo-body-medium">
                  {t(
                    'ApplicationDetailsPage.proposedBusiness.businessPerformance.addCustomField',
                  )}
                </p>
              </Underline>
            </Button>
          </div>

          <div className="overflow-hidden border-t border-neutral-400">
            <h2 className="typo-h5 py-4">
              {t(
                'ApplicationDetailsPage.proposedBusiness.businessPerformance.netSurplus',
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

      <input
        type="hidden"
        name="customExpenses"
        value={JSON.stringify(
          customExpenses
            .filter((expense) => expense.name.trim() !== '')
            .map((expense) => ({
              name: expense.name,
              amount: expense.amount.toString(),
            })),
        )}
      />

      <input type="hidden" name="redirectTo" value={nextUrl} />

      <ApplyFormActionBar
        disabled={isPending}
        nextUrl={nextUrl}
        prevUrl={prevUrl}
      />
    </Form>
  );
};
