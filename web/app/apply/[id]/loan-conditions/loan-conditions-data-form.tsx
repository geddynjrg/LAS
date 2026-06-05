'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  type LoanConditionsData,
  loanConditionsDataSchema,
} from '@/app/apply/[id]/loan-conditions/loan-conditions-schema';
import type { TaxonomyOption } from '@/lib/api/taxonomy.service';
import {
  getBranchesForBank,
  getUniqueBanks,
  loadKenyaBankBranches,
  type BankBranch,
} from '@/lib/data/kenya-bank-branches';
import { LoanConditionsData as ApplicationLoanConditionsData } from '@/lib/types/application.types';
import { Container } from '@workspace/ui/components/container';
import { Field, Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { RadioGroup } from '@workspace/ui/components/radio-group';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Slider } from '@workspace/ui/components/slider';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useMemo, useState } from 'react';

export interface LoanConditionsDataProps {
  id: string;
  action: FormAction<LoanConditionsData>;
  loanConditionsData?: ApplicationLoanConditionsData;
  taxonomyOptions?: {
    bankName: TaxonomyOption[];
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
      institutionType: loanConditionsData?.institutionType,
      loanAmount: loanConditionsData?.loanAmount,
      loanType: loanConditionsData?.loanType,
      repaymentPeriod: loanConditionsData?.repaymentPeriod,
    },
  );

  const [selectedType, setSelectedType] = useState<
    keyof typeof loanTypes | undefined
  >(state.values?.loanType as keyof typeof loanTypes);

  const [institutionType, setInstitutionType] = useState<
    keyof typeof institutionTypes | undefined
  >(state.values?.institutionType as keyof typeof institutionTypes);

  const [bankBranches, setBankBranches] = useState<BankBranch[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | undefined>(
    state.values?.bankName,
  );

  useEffect(() => {
    let cancelled = false;
    setBanksLoading(true);
    loadKenyaBankBranches()
      .then((rows) => {
        if (!cancelled) {
          setBankBranches(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBankBranches([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBanksLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.values?.bankName) {
      setSelectedBank(state.values.bankName);
    }
  }, [state.values?.bankName]);

  const bankOptions = useMemo(
    () =>
      getUniqueBanks(bankBranches).map((bank) => ({
        label: bank,
        value: bank,
      })),
    [bankBranches],
  );

  const branchOptions = useMemo(
    () => getBranchesForBank(bankBranches, selectedBank || ''),
    [bankBranches, selectedBank],
  );

  const loanTypes = {
    Endeleza: {
      title: 'Endeleza',
      maxLoanAmount: '500 000',
      content: {
        title: t('ApplicationDetailsPage.loan.LoanDescriptionEndeleza'),
        underText: t('ApplicationDetailsPage.loan.Interest'),
      },
    },
    Wezesha: {
      title: 'Wezesha',
      maxLoanAmount: '100 000',
      content: {
        title: t('ApplicationDetailsPage.loan.LoanDescriptionWezesha'),
        underText: t('ApplicationDetailsPage.loan.Interest'),
      },
    },
  };

  // const institutionTypes = {
  //   bank: t('ApplicationDetailsPage.loan.bank'),
  //   sacco: t('ApplicationDetailsPage.loan.sacco'),
  // };

  const institutionTypes = {
    Bank: {
      title: 'Bank',
      Content: {
        title: t('ApplicationDetailsPage.loan.bank'),
      },
    },
    SACCO: {
      title: 'SACCO',
      Content: {
        title: t('ApplicationDetailsPage.loan.sacco'),
      },
    },
  };

  const isBankInstitution =
    institutionType === institutionTypes.Bank.title ||
    state.values?.institutionType === institutionTypes.Bank.title;

  const maxAmount = selectedType
    ? loanTypes[selectedType]?.maxLoanAmount
    : undefined;

  const prevUrl = `/apply/${id}/members`;
  const nextUrl = `/apply/${id}/proposed-business`;

  return (
    <Form action={formAction} autoComplete="on">
      <Container className="space-y-8">
        <FormCard
          title={t('ApplicationDetailsPage.loan.loanDetails')}
          className="space-y-4"
        >
          <Field
            state={state}
            name="loanType"
            label={t('ApplicationDetailsPage.loan.loanType')}
            required
            control={(props) => (
              <RadioGroup
                {...props}
                onValueChange={(val) =>
                  setSelectedType(val as keyof typeof loanTypes)
                }
                options={[
                  {
                    label: loanTypes.Wezesha.title,
                    value: loanTypes.Wezesha.title,
                    description: (
                      <div>
                        <div>{loanTypes.Wezesha.content.title}</div>
                        <div className="font-bold">{loanTypes.Wezesha.content.underText}</div>
                      </div>
                    )
                  },
                  {
                    label: loanTypes.Endeleza.title,
                    value: loanTypes.Endeleza.title,
                    description: (
                      <div>
                        <div>{loanTypes.Endeleza.content.title}</div>
                        <div className="font-bold">{loanTypes.Endeleza.content.underText}</div>
                      </div>
                    )
                  },
                ]}
              />
            )}
          />

          <Field
            state={state}
            name="loanAmount"
            label={t('ApplicationDetailsPage.loan.loanAmount')}
            required
            description={
              maxAmount
                ? t('ApplicationDetailsPage.loan.maximumLoan', {
                    count: maxAmount,
                  })
                : ''
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
            label={t('ApplicationDetailsPage.loan.repaymentPeriod')}
            required
            control={(props) => (
              <Slider
                startDecorator={t('Common.monthCount', { count: 1 })}
                endDecorator={t('Common.monthCount', { count: 24 })}
                thumbLabel={(value) =>
                  value ? t('Common.monthCount', { count: value }) : undefined
                }
                {...props}
                min={1}
                max={24}
              />
            )}
          />
        </FormCard>

        {/* <FormCard
          title={t('ApplicationDetailsPage.loan.bankAccountDetails')}
          className="space-y-4"
        >
          <Field
            state={state}
            name="bankName"
            label={t('ApplicationDetailsPage.loan.bankName')}
            required
            control={(props) => (
              <RadioGroup
                {...props}
                onValueChange={(val) => setSelectedBankName(val)}
                options={[
                  ...(taxonomyOptions?.bankName || []),
                  { label: t('Common.other'), value: 'Other' },
                ]}
              />
            )}
          />

          {selectedBankName === 'Other' && (
            <Field
              state={state}
              name="bankNameOther"
              required
              control={(props) => (
                <Input
                  {...props}
                  defaultValue={props.defaultValue ?? undefined}
                  placeholder={t('ApplicationDetailsPage.loan.bankName')}
                />
              )}
            />
          )}

          <Field
            state={state}
            name="bankBranch"
            label={t('ApplicationDetailsPage.loan.bankBranch')}
            required
            control={(props) => <Input {...props} />}
          />

          <Field
            state={state}
            name="accountNumber"
            label={t('ApplicationDetailsPage.loan.accountNumber')}
            required
            control={(props) => <Input {...props} />}
          />
        </FormCard> */}
        <FormCard
          title={t('ApplicationDetailsPage.loan.bankAccountDetails')}
          className="space-y-4"
          >
          <Field
            state={state}
            name="institutionType"
            label={
              <div>
                {t('ApplicationDetailsPage.loan.institutionType')}
              </div>
            }
            required
            control={(props) => (
              <RadioGroup
                {...props}
                onValueChange={(val) => {
                  setInstitutionType(val as keyof typeof institutionTypes);
                }}
                options={[
                  {
                    label: t('ApplicationDetailsPage.loan.bank'),
                    value: institutionTypes.Bank.title,
                  },
                  {
                    label: t('ApplicationDetailsPage.loan.sacco'),
                    value: institutionTypes.SACCO.title,
                  },
                ]}
              />
            )}
          />

          {institutionType && (
            <Field
              state={state}
              name="bankName"
              label={
                isBankInstitution
                  ? t('ApplicationDetailsPage.loan.bankName')
                  : t('ApplicationDetailsPage.loan.saccoName')
              }
              required
              control={(props) =>
                isBankInstitution ? (
                  <SearchInput
                    {...props}
                    defaultValue={
                      props.defaultValue ?? state.values?.bankName
                    }
                    placeholder={t(
                      'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                    )}
                    options={bankOptions}
                    isLoading={banksLoading}
                    onValueChange={(value) => {
                      setSelectedBank(value);
                    }}
                    onValueSelect={(value) => {
                      setSelectedBank(value);
                    }}
                  />
                ) : (
                  <Input
                    {...props}
                    defaultValue={props.defaultValue ?? undefined}
                    placeholder={t(
                      'ApplicationDetailsPage.loan.enterSaccoName',
                    )}
                  />
                )
              }
            />
          )}

          <Field
            state={state}
            name="bankBranch"
            label={t('ApplicationDetailsPage.loan.bankBranch')}
            required
            control={(props) =>
              isBankInstitution ? (
                <SearchInput
                  {...props}
                  defaultValue={props.defaultValue ?? state.values?.bankBranch}
                  placeholder={t(
                    'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                  )}
                  options={branchOptions}
                  isLoading={banksLoading}
                  disabled={!selectedBank && !state.values?.bankName}
                />
              ) : (
                <Input {...props} />
              )
            }
          />

          <Field
            state={state}
            name="accountNumber"
            label={t('ApplicationDetailsPage.loan.accountNumber')}
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
