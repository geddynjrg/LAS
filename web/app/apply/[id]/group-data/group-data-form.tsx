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
import { getWardsForConstituencyName } from '@/lib/api/wards.service';
import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { normalizeGroupActivitySelections } from '@/lib/constants/group-activities-taxonomy';
import { GroupData as ApplicationGroupData } from '@/lib/types/application.types';
import { IconInfoCircle } from '@tabler/icons-react';
import { CheckboxGroup } from '@workspace/ui/components/checkbox-group';
import { Container } from '@workspace/ui/components/container';
import { FileUploadInput } from '@workspace/ui/components/file-upload-input';
import { Field, Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { LandmarkMapInput } from '@workspace/ui/components/landmark-map-input';
import { SearchInput } from '@workspace/ui/components/search-input';
import { Underline } from '@workspace/ui/components/underline';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type FC, useCallback, useEffect, useState } from 'react';

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
  const [filteredWards, setFilteredWards] = useState<TaxonomyOption[]>([]);

  const [state, formAction, isPending] = useForm(action, groupDataSchema, {
    groupName: applicationGroupData?.basics?.groupName,
    groupRegistrationNumber:
      applicationGroupData?.basics?.groupRegistrationNumber,
    dateFormed: applicationGroupData?.basics?.dateFormed,
    groupRegistrationCertificate:
      applicationGroupData?.basics?.groupRegistrationCertificate,
    listOfMembersOnCertificate:
      applicationGroupData?.basics?.listOfMembersOnCertificate,
    groupMeetingMinutes: applicationGroupData?.basics?.groupMeetingMinutes
      ? Array.isArray(applicationGroupData.basics.groupMeetingMinutes)
        ? applicationGroupData.basics.groupMeetingMinutes
        : [applicationGroupData.basics.groupMeetingMinutes]
      : undefined,
    groupPurpose: applicationGroupData?.background?.purposeOfTheGroup,
    groupActivities: applicationGroupData?.background?.keyActivitiesOfTheGroup
      ? normalizeGroupActivitySelections(
          applicationGroupData.background.keyActivitiesOfTheGroup,
        )
      : undefined,
    valueChain: applicationGroupData?.background?.valueChain ?? undefined,
    tableBankingExperience:
      applicationGroupData?.background?.tableBanking?.tableBankingExperience,
    tableBankingShareContribution:
      applicationGroupData?.background?.tableBanking
        ?.tableBankingShareContribution,
    tableBankingTotalLoanedOut:
      applicationGroupData?.background?.tableBanking
        ?.tableBankingTotalLoanedOut,
    tableBankingTotalRevolvingFund:
      applicationGroupData?.background?.tableBanking
        ?.tableBankingTotalRevolvingFund,
    other: applicationGroupData?.background?.other,
    groupCreditHistory: applicationGroupData?.background?.groupCreditHistory
      ? Array.isArray(applicationGroupData.background.groupCreditHistory)
        ? applicationGroupData.background.groupCreditHistory
        : [applicationGroupData.background.groupCreditHistory]
      : undefined,
    countyOfOperation: applicationGroupData?.location?.countyOfOperation,
    constituency: applicationGroupData?.location?.constituency,
    ward: applicationGroupData?.location?.ward,
    meetingPoint: applicationGroupData?.location?.meetingPoint,
    nearestLandmark: applicationGroupData?.location?.nearestLandmark,
  });

  const t = useTranslations();
  const [chosenCounty, setChosenCounty] = useState(
    state.values?.countyOfOperation,
  );
  const [chosenConstituency, setChosenConstituency] = useState(
    state.values?.constituency,
  );
  const [chosenWard, setChosenWard] = useState(state.values?.ward);
  const [isLoadingConstituencies, setIsLoadingConstituencies] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [wardLoadHint, setWardLoadHint] = useState<string | null>(null);
  const [chosenKeyActivities, setChosenKeyActivities] = useState(
    state.values?.groupActivities,
  );

  const constituencyOptionsForValidation = useCallback(
    (constituencyName: string) => {
      const trimmed = constituencyName.trim();
      const fromFiltered = filteredConstituencies.some(
        (c) => c.value === trimmed || c.label === trimmed,
      );
      if (fromFiltered) {
        return true;
      }
      return (taxonomyOptions?.constituency ?? []).some(
        (c) => c.value === trimmed || c.label === trimmed,
      );
    },
    [filteredConstituencies, taxonomyOptions?.constituency],
  );

  // Helper function for case-insensitive and trimmed string matching
  const includesTerm = (
    activities: string[] | undefined,
    term: string,
  ): boolean => {
    if (!activities) return false;
    const normalizedTerm = term.toLowerCase().trim();
    return activities.some(
      (activity) => activity.toLowerCase().trim() === normalizedTerm,
    );
  };

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

  const updateWardsForConstituency = useCallback(
    async (
      constituencyName: string,
      options?: { requireValidOption?: boolean },
    ) => {
      const trimmed = constituencyName?.trim();
      if (!trimmed) {
        setFilteredWards([]);
        setWardLoadHint(null);
        return;
      }

      if (
        options?.requireValidOption &&
        !constituencyOptionsForValidation(trimmed)
      ) {
        return;
      }

      setIsLoadingWards(true);
      setWardLoadHint(null);
      try {
        const wards = await getWardsForConstituencyName(trimmed);
        setFilteredWards(wards);
        if (wards.length === 0) {
          setWardLoadHint(
            'No wards were found for this constituency. You can still type the ward name.',
          );
        }
      } catch (error) {
        console.error('Error fetching wards:', error);
        setFilteredWards([]);
        setWardLoadHint(
          'Could not load wards. You can still type the ward name.',
        );
      } finally {
        setIsLoadingWards(false);
      }
    },
    [constituencyOptionsForValidation],
  );

  useEffect(() => {
    const constituency = state.values?.constituency;
    if (constituency) {
      void updateWardsForConstituency(constituency, {
        requireValidOption: false,
      });
    }
  }, [state.values?.constituency, updateWardsForConstituency]);

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
              <Input type="text" placeholder="Registration number" {...props} />
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

          <Field
            state={state}
            name="groupMeetingMinutes"
            label={
              <div>
                <div>
                  {t(
                    'ApplicationDetailsPage.groupData.basicInfo.groupMeetingMinutes',
                  )}
                  <span className="text-destructive">*</span>
                </div>
                <div className="typo-body-small text-foreground font-normal mt-1">
                  {t(
                    'ApplicationDetailsPage.groupData.basicInfo.groupMeetingMinutesDescription',
                  )}
                </div>
              </div>
            }
            description={t('Common.youCanAddMultipleFiles')}
            required
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
                options={taxonomyOptions?.groupPurpose || []}
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
                options={taxonomyOptions?.groupActivities || []}
                orientation="vertical"
              />
            )}
          />

          {includesTerm(chosenKeyActivities, 'Value chain') && (
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
                  options={taxonomyOptions?.valueChain || []}
                  orientation="vertical"
                />
              )}
            />
          )}
          {includesTerm(chosenKeyActivities, 'Table banking') && (
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
          {includesTerm(chosenKeyActivities, 'Other') && (
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
            label={
              <div>
                <div>
                  {t(
                    'ApplicationDetailsPage.groupData.groupBackground.creditHistory',
                  )}
                </div>
                <div className="typo-body-small text-foreground font-normal mt-1">
                  {t('ApplicationDetailsPage.loan.creditHistoryDescription')}
                </div>
              </div>
            }
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
                defaultValue={
                  props.defaultValue ?? state.values?.countyOfOperation
                }
                onValueChange={(value) => {
                  setChosenCounty(value);
                }}
                onValueSelect={(value) => {
                  setChosenCounty(value);
                  setChosenConstituency(undefined);
                  setChosenWard(undefined);
                  setFilteredWards([]);
                  setWardLoadHint(null);
                  if (value) {
                    void updateConstituenciesForCounty(value);
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
                defaultValue={props.defaultValue ?? state.values?.constituency}
                onValueChange={(value) => {
                  setChosenConstituency(value);
                  if (!value) {
                    setChosenWard(undefined);
                    setFilteredWards([]);
                    setWardLoadHint(null);
                  }
                }}
                onValueSelect={(value) => {
                  setChosenConstituency(value);
                  setChosenWard(undefined);
                  void updateWardsForConstituency(value, {
                    requireValidOption: true,
                  });
                }}
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                )}
                options={filteredConstituencies}
                isLoading={isLoadingConstituencies}
              />
            )}
          />

          <Field
            state={state}
            name="ward"
            label={t('Common.ward')}
            required
            control={(props) => (
              <div className="flex w-full flex-col gap-1">
                <SearchInput
                  {...props}
                  defaultValue={props.defaultValue ?? state.values?.ward}
                  placeholder={t(
                    'ApplicationDetailsPage.groupData.groupBackground.chooseOrSearch',
                  )}
                  options={filteredWards}
                  isLoading={isLoadingWards}
                  disabled={
                    !(chosenConstituency || state.values?.constituency) ||
                    isLoadingWards
                  }
                  onValueChange={(value) => {
                    setChosenWard(value);
                  }}
                />
                {wardLoadHint ? (
                  <p className="text-muted-foreground typo-body-small">
                    {wardLoadHint}
                  </p>
                ) : null}
              </div>
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
              <LandmarkMapInput
                {...props}
                placeholder={t(
                  'ApplicationDetailsPage.groupData.groupBackground.nearestLandmarkExamples',
                )}
                locationContext={{
                  county: chosenCounty,
                  constituency: chosenConstituency,
                  ward: chosenWard,
                }}
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
