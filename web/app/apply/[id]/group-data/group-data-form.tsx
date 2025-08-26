'use client';

import {
  uploadFileAction,
  uploadSingleFileAction,
} from '@/app/actions/file-upload';
import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  type GroupData,
  groupDataSchema,
} from '@/app/apply/[id]/group-data/group-data-schema';
import { getConstituenciesForCountyName } from '@/lib/api/counties.service';
import type { TaxonomyOption } from '@/lib/api/taxonomy.service';
import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { GroupData as ApplicationGroupData } from '@/lib/data/application';
import { IconInfoCircle } from '@tabler/icons-react';
import { CheckboxGroup } from '@workspace/ui/components/checkbox-group';
import { Container } from '@workspace/ui/components/container';
import { FileUploadInput } from '@workspace/ui/components/file-upload-input';
import { Field, Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Underline } from '@workspace/ui/components/underline';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type FC, useCallback, useState } from 'react';

export interface GroupDataProps {
  id: string;
  applicationGroupData?: ApplicationGroupData;
  action: FormAction<GroupData>;
  taxonomyOptions?: {
    groupPurpose: TaxonomyOption[];
    groupActivities: TaxonomyOption[];
    valueChain: TaxonomyOption[];
    county: TaxonomyOption[];
    constituency: TaxonomyOption[];
  };
}

export const GroupDataForm: FC<GroupDataProps> = ({
  action,
  id,
  applicationGroupData,
  taxonomyOptions,
}) => {
  // State for filtered constituencies based on selected county
  const [filteredConstituencies, setFilteredConstituencies] = useState<
    TaxonomyOption[]
  >(taxonomyOptions?.constituency || []);

  const [state, formAction, isPending] = useForm(action, groupDataSchema, {
    groupName: applicationGroupData?.basics.groupName,
    groupRegistrationNumber:
      applicationGroupData?.basics.groupRegistrationNumber,
    dateFormed: applicationGroupData?.basics.dateFormed,
    groupRegistrationCertificate:
      applicationGroupData?.basics.groupRegistrationCertificate,
    listOfMembersOnCertificate:
      applicationGroupData?.basics.listOfMembersOnCertificate,
    groupPurpose: applicationGroupData?.background.purposeOfTheGroup,
    groupActivities: applicationGroupData?.background.keyActivitiesOfTheGroup,
    valueChain: applicationGroupData?.background.valueChain ?? undefined,
    tableBankingExperience:
      applicationGroupData?.background.tableBanking?.tableBankingExperience,
    tableBankingShareContribution:
      applicationGroupData?.background.tableBanking
        ?.tableBankingShareContribution,
    tableBankingTotalLoanedOut:
      applicationGroupData?.background.tableBanking?.tableBankingTotalLoanedOut,
    tableBankingTotalRevolvingFund:
      applicationGroupData?.background.tableBanking
        ?.tableBankingTotalRevolvingFund,
    other: applicationGroupData?.background.other,
    groupCreditHistory: applicationGroupData?.background.groupCreditHistory
      ? Array.isArray(applicationGroupData.background.groupCreditHistory)
        ? applicationGroupData.background.groupCreditHistory
        : [applicationGroupData.background.groupCreditHistory]
      : undefined,
    countyOfOperation: applicationGroupData?.location.countyOfOperation,
    constituency: applicationGroupData?.location.constituency,
    ward: applicationGroupData?.location.ward,
    meetingPoint: applicationGroupData?.location.meetingPoint,
    nearestLandmark: applicationGroupData?.location.nearestLandmark,
  });

  const t = useTranslations();
  const [chosenCounty, setChosenCounty] = useState(
    state.values?.countyOfOperation,
  );
  const [isLoadingConstituencies, setIsLoadingConstituencies] = useState(false);
  const [chosenKeyActivities, setChosenKeyActivities] = useState(
    state.values?.groupActivities,
  );

  // Update constituencies when county selection is made (not while typing)
  const updateConstituenciesForCounty = useCallback(
    async (countyName: string) => {
      // Only fetch if it's a valid county from our options list
      const isValidCounty = taxonomyOptions?.county?.some(
        (c) => c.value === countyName || c.label === countyName,
      );

      if (countyName && isValidCounty && countyName !== chosenCounty) {
        console.log('Fetching constituencies for county:', countyName);
        setIsLoadingConstituencies(true);
        try {
          const constituencies =
            await getConstituenciesForCountyName(countyName);
          setFilteredConstituencies(constituencies);
          console.log('Found constituencies:', constituencies.length);
        } catch (error) {
          console.error('Error fetching constituencies:', error);
          setFilteredConstituencies([]);
        } finally {
          setIsLoadingConstituencies(false);
        }
      } else if (!countyName) {
        setFilteredConstituencies(taxonomyOptions?.constituency || []);
      }
    },
    [chosenCounty, taxonomyOptions?.county, taxonomyOptions?.constituency],
  );

  const prevUrl = `/apply`;
  const nextUrl = `/apply/${id}/members`;

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      <Container>
        <FormCard
          title={t('ApplicationDetailsPage.groupData.basicInfo.groupBasics')}
          className="mt-7 grid gap-4"
        >
          <Field
            state={state}
            name="groupName"
            label={t('ApplicationDetailsPage.groupData.basicInfo.groupName')}
            required
            control={(props) => <Input placeholder="Enter name" {...props} />}
          />
          <Field
            state={state}
            name="groupRegistrationNumber"
            label={t(
              'ApplicationDetailsPage.groupData.basicInfo.groupRegistrationNumber',
            )}
            required
            control={(props) => (
              <Input type="tel" placeholder="Registration number" {...props} />
            )}
          />
          <Field
            label={t(
              'ApplicationDetailsPage.groupData.basicInfo.dateRegistered',
            )}
            name="dateFormed"
            required
            control={(props) => <Input type="date" {...props} />}
            state={state}
          />

          <Field
            state={state}
            name="groupRegistrationCertificate"
            label={t(
              'ApplicationDetailsPage.groupData.basicInfo.groupRegistrationCert',
            )}
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                applicationId={id}
                enableUpload={true}
                uploadAction={uploadSingleFileAction}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="listOfMembersOnCertificate"
            label={t(
              'ApplicationDetailsPage.groupData.basicInfo.listOfMembersOnCert',
            )}
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                applicationId={id}
                enableUpload={true}
                uploadAction={uploadSingleFileAction}
                {...props}
              />
            )}
          />
        </FormCard>

        <FormCard
          title={t(
            'ApplicationDetailsPage.groupData.groupBackground.groupBackground',
          )}
          className="mt-7 grid gap-4"
        >
          <Field
            state={state}
            name="groupPurpose"
            label={t(
              'ApplicationDetailsPage.groupData.groupBackground.groupBackground',
            )}
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                options={
                  taxonomyOptions?.groupPurpose?.length
                    ? taxonomyOptions.groupPurpose
                    : [
                        {
                          label: t(
                            'ApplicationDetailsPage.groupData.groupBackground.welfareIssues',
                          ),
                          value: 'Welfare issues',
                        },
                        {
                          label: t(
                            'ApplicationDetailsPage.groupData.groupBackground.incomeActivities',
                          ),
                          value: 'Income generating activities',
                        },
                        {
                          label: t('Common.other'),
                          value: 'Other',
                        },
                      ]
                }
                orientation="vertical"
              />
            )}
          />

          <Field
            state={state}
            name="groupActivities"
            label={t(
              'ApplicationDetailsPage.groupData.groupBackground.keyActivitiesOfGroup',
            )}
            required
            control={(props) => (
              <CheckboxGroup
                {...props}
                onValueChange={(val) => {
                  // Use setTimeout to avoid setState during render
                  setTimeout(() => setChosenKeyActivities(val), 0);
                }}
                options={
                  taxonomyOptions?.groupActivities?.length
                    ? taxonomyOptions.groupActivities
                    : [
                        {
                          label: t(
                            'ApplicationDetailsPage.groupData.groupBackground.valueChain',
                          ),
                          value: 'Value chain',
                        },
                        {
                          label: t(
                            'ApplicationDetailsPage.groupData.groupBackground.tableBanking',
                          ),
                          value: 'Table banking',
                        },
                        {
                          label: t('Common.other'),
                          value: 'Other',
                        },
                      ]
                }
                orientation="vertical"
              />
            )}
          />

          {chosenKeyActivities?.includes('Value chain') && (
            <Field
              state={state}
              name="valueChain"
              label={t(
                'ApplicationDetailsPage.groupData.groupBackground.valueChain',
              )}
              required
              control={(props) => (
                <CheckboxGroup
                  {...props}
                  defaultValue={props.defaultValue ?? []}
                  options={
                    taxonomyOptions?.valueChain?.length
                      ? taxonomyOptions.valueChain
                      : [
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.leatherProducts',
                            ),
                            value: 'Leather and leather products',
                          },
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.cottonAndTextile',
                            ),
                            value: 'Cotton and textiles',
                          },
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.blueEconomy',
                            ),
                            value: 'Blue economy',
                          },
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.edibleOils',
                            ),
                            value: 'Edible oils',
                          },
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.constructionAndBuilding',
                            ),
                            value: 'Construction and building materials',
                          },
                          {
                            label: t(
                              'ApplicationDetailsPage.groupData.groupBackground.dairyProducts',
                            ),
                            value: 'Dairy and dairy products',
                          },
                        ]
                  }
                  orientation="vertical"
                />
              )}
            />
          )}
          {chosenKeyActivities?.includes('Table banking') && (
            <div>
              <Field
                state={state}
                name="tableBankingExperience"
                label={t(
                  'ApplicationDetailsPage.groupData.groupBackground.tableBankingPractice',
                )}
                required
                control={(props) => (
                  <Input
                    defaultValue={props.defaultValue?.toString()}
                    type="number"
                    {...props}
                  />
                )}
              />
              <Field
                state={state}
                name="tableBankingShareContribution"
                label={t(
                  'ApplicationDetailsPage.groupData.groupBackground.monthlyShareContribution',
                )}
                required
                control={(props) => (
                  <Input
                    defaultValue={props.defaultValue?.toString()}
                    type="number"
                    {...props}
                  />
                )}
              />
              <Field
                state={state}
                name="tableBankingTotalLoanedOut"
                label={t(
                  'ApplicationDetailsPage.groupData.groupBackground.totalLoanedOut',
                )}
                required
                control={(props) => (
                  <Input
                    defaultValue={props.defaultValue?.toString()}
                    type="number"
                    endDecorator="KSh"
                    {...props}
                  />
                )}
              />
              <Field
                state={state}
                name="tableBankingTotalRevolvingFund"
                label={t(
                  'ApplicationDetailsPage.groupData.groupBackground.totalRevolvingFund',
                )}
                required
                control={(props) => (
                  <Input
                    defaultValue={props.defaultValue?.toString()}
                    type="number"
                    endDecorator="KSh"
                    {...props}
                  />
                )}
              />
            </div>
          )}
          {chosenKeyActivities?.includes('Other') && (
            <Field
              state={state}
              name="other"
              label={t('Common.specify')}
              required
              control={(props) => (
                <Input
                  {...props}
                  defaultValue={props.defaultValue ?? undefined}
                />
              )}
            />
          )}

          <Field
            state={state}
            name="groupCreditHistory"
            label={t(
              'ApplicationDetailsPage.groupData.groupBackground.creditHistory',
            )}
            required
            description={t('Common.youCanAddMultipleFiles')}
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                applicationId={id}
                enableUpload={true}
                multiple
                uploadAction={uploadFileAction}
                {...props}
              />
            )}
          />

          <Link href="#">
            <Underline
              variant="primary"
              className="text-primary hover:cursor-pointer"
            >
              <p className="mt-4 flex items-center gap-1">
                <IconInfoCircle />
                {t(
                  'ApplicationDetailsPage.groupData.groupBackground.creditHistoryDocument',
                )}
              </p>
            </Underline>
          </Link>
        </FormCard>

        <FormCard
          title={t(
            'ApplicationDetailsPage.groupData.locationInfo.locationOfTheGroup',
          )}
          subtitle={t(
            'ApplicationDetailsPage.groupData.groupBackground.groupReferralContact',
          )}
          className="mt-7 grid gap-4"
        >
          <Field
            state={state}
            name="countyOfOperation"
            label={t(
              'ApplicationDetailsPage.groupData.groupBackground.countyOfOperation',
            )}
            required
            control={(props) => (
              <SearchInput
                {...props}
                onValueChange={(value) => {
                  setChosenCounty(value);
                  if (value) {
                    updateConstituenciesForCounty(value);
                  } else {
                    setFilteredConstituencies(
                      taxonomyOptions?.constituency || [],
                    );
                  }
                }}
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                )}
                options={taxonomyOptions?.county || []}
              />
            )}
          />
          <Field
            state={state}
            name="constituency"
            label={t('Common.constituency')}
            required
            control={(props) => (
              <SearchInput
                {...props}
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                )}
                options={filteredConstituencies}
              />
            )}
          />

          <Field
            state={state}
            name="ward"
            label={t('Common.ward')}
            required
            control={(props) => (
              <Input
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.enterWard',
                )}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="meetingPoint"
            label={t(
              'ApplicationDetailsPage.groupData.locationInfo.meetingPoint',
            )}
            control={(props) => (
              <Input
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.meetingPointExamples',
                )}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="nearestLandmark"
            label={t(
              'ApplicationDetailsPage.groupData.locationInfo.nearestLandmark',
            )}
            control={(props) => (
              <Input
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.nearestLandmarkExamples',
                )}
                {...props}
              />
            )}
          />
        </FormCard>
      </Container>

      {/* Pass id to form submit */}
      <input type="hidden" name="id" value={id} />

      {/* Redirect to next view on success */}
      <input type="hidden" name="redirectTo" value={nextUrl} />

      <ApplyFormActionBar
        disabled={isPending}
        nextUrl={nextUrl}
        prevUrl={prevUrl}
      />
    </Form>
  );
};
