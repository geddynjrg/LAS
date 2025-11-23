'use client';

import { uploadSingleFileAction } from '@/app/actions/file-upload';
import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import { memberAction } from '@/app/apply/[id]/members/member-action';
import { memberSchema } from '@/app/apply/[id]/members/member-schema';
import {
  type MembersData,
  membersDataSchema,
} from '@/app/apply/[id]/members/members-data-schema';
import {
  type MemberValidationResult,
  canAssignRole,
  canAssignPhoneNumber,
  canAssignNationalId,
  getMemberValidationErrorMessages,
  validateMembersAgainstTaxonomy,
} from '@/app/apply/[id]/members/members-validation';
import { TaxonomyOption } from '@/lib/api/taxonomy.service';
import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { updateApplicationMembersData } from '@/lib/data/application';
import {
  MembersData as ApplicationMembersData,
  type GenderType,
  type Member,
} from '@/lib/types/application.types';
import { capitalizeWords } from '@/lib/utils/string';
import {
  IconCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Container } from '@workspace/ui/components/container';
import { DataNode } from '@workspace/ui/components/data-node';
import { FileUploadInput } from '@workspace/ui/components/file-upload-input';
import { Field, Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { RadioGroup } from '@workspace/ui/components/radio-group';
import { Select } from '@workspace/ui/components/select';
import { Underline } from '@workspace/ui/components/underline';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import {
  PersonAccordion,
  PersonAccordionContent,
  PersonAccordionItem,
  PersonAccordionTrigger,
} from '@workspace/ui/components/uwezo/personAccordion';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { formatBytes } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

// Helper function to extract error message from various error types
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message;
  }
  return 'members_required'; // Return a flag for translation
};

export interface MembersDataProps {
  id: string;
  action: FormAction<MembersData>;
  applicationMembersData?: ApplicationMembersData;
  memberTypeOptions?: TaxonomyOption[];
}

export const MembersDataForm: FC<MembersDataProps> = ({
  action,
  id,
  applicationMembersData,
  memberTypeOptions,
}) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useForm(action, membersDataSchema, {
    natureOfGroup: applicationMembersData?.natureOfTheGroup,
  });
  const [members, setMembers] = useState<Partial<Member>[]>(
    applicationMembersData?.members ?? [],
  );
  const [displayNewMemberForm, setDisplayNewMemberForm] = useState(false);
  const [membersInEdit, setMembersInEdit] = useState<number[]>([]);
  const [membersValidation, setMembersValidation] =
    useState<MemberValidationResult>({ isValid: true, errors: [] });

  // Real-time validation whenever members or taxonomy options change
  useEffect(() => {
    if (memberTypeOptions && members.length > 0) {
      const validation = validateMembersAgainstTaxonomy(
        members,
        memberTypeOptions,
      );
      setMembersValidation(validation);
    } else {
      setMembersValidation({ isValid: true, errors: [] });
    }
  }, [members, memberTypeOptions]);

  const prevUrl = `/apply/${id}/group-data`;
  const nextUrl = `/apply/${id}/loan-conditions`;

  const saveMembersData = async (updatedMembers: Partial<Member>[]) => {
    try {
      // Validate members before saving
      if (memberTypeOptions) {
        const validation = validateMembersAgainstTaxonomy(
          updatedMembers,
          memberTypeOptions,
        );
        setMembersValidation(validation);

        if (!validation.isValid) {
          console.warn('Members validation failed:', validation.errors);
          return; // Don't save if validation fails
        }
      }

      await updateApplicationMembersData(id, {
        natureOfTheGroup:
          state.values?.natureOfGroup ||
          applicationMembersData?.natureOfTheGroup ||
          '',
        members: updatedMembers as Member[],
      });
    } catch (error) {
      console.error('Failed to save members:', error);
    }
  };

  const handleNatureOfGroupChange = async (value: string) => {
    try {
      await updateApplicationMembersData(id, {
        natureOfTheGroup: value,
        members: members as Member[],
      });
    } catch (error) {
      console.error('Failed to save nature of group:', error);
    }
  };

  const handleMemberRemove = async (memberId: string | undefined) => {
    if (!memberId) {
      return;
    }

    const updatedMembers = members.filter(
      (member) => member.nationalIdCode !== memberId,
    );
    setMembers(updatedMembers);
    await saveMembersData(updatedMembers);
  };

  return (
    <Form
      action={formAction}
      className="grow-1 flex flex-col justify-between space-y-6"
      autoComplete="on"
    >
      <Container>
        <FormCard title={t('MembersPage.member')} className="mt-7 grid gap-4">
          <Field
            className="border-b border-neutral-400 pb-4"
            state={state}
            name="natureOfGroup"
            label={t('MembersPage.natureOfTheGroup')}
            required
            control={(props) => (
              <RadioGroup
                {...props}
                onValueChange={(value) => {
                  if (value) {
                    handleNatureOfGroupChange(value);
                  }
                }}
                options={[
                  {
                    label: t('MembersPage.youth'),
                    value: 'youth',
                  },
                  {
                    label: t('MembersPage.peopleWithDisabilities'),
                    value: 'pwd',
                  },
                  {
                    label: t('MembersPage.women'),
                    value: 'women',
                  },
                ]}
              />
            )}
          />

          {memberTypeOptions && memberTypeOptions.length > 0 ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                !displayNewMemberForm && setDisplayNewMemberForm(true)
              }
            >
              <IconPlus /> {t('MembersPage.addMember')}
            </Button>
          ) : (
            <div className="text-destructive text-sm font-medium p-4 border border-destructive rounded-md bg-destructive/5">
              <div className="font-semibold mb-2">
                Member position types unavailable
              </div>
              <div className="text-xs">
                Unable to load member position types from the system. Please
                refresh the page and try again.
                <br />
                <span className="font-medium">
                  You cannot add or edit members until this is resolved.
                </span>
              </div>
            </div>
          )}
          <p className="typo-body-large mx-auto font-bold">
            {t('MembersPage.membersInfoInserted', { count: members.length })}
          </p>

          {state.errors?.members && (
            <div className="text-destructive text-sm font-medium">
              {(() => {
                const errorMsg = Array.isArray(state.errors.members)
                  ? getErrorMessage(state.errors.members[0])
                  : getErrorMessage(state.errors.members);

                return errorMsg === 'members_required'
                  ? t('MembersPage.errors.atLeastOneMemberRequired')
                  : errorMsg;
              })()}
            </div>
          )}

          {/* Members validation errors */}
          {!membersValidation.isValid && (
            <div className="text-destructive text-sm font-medium space-y-1">
              <div className="font-semibold">Member role conflicts:</div>
              {getMemberValidationErrorMessages(membersValidation).map(
                (error, index) => (
                  <div key={index} className="text-xs">
                    • {error}
                  </div>
                ),
              )}
            </div>
          )}

          {displayNewMemberForm && (
            <EditMemberFormFields
              onSuccess={async (member) => {
                const updatedMembers = [...members, member];
                setMembers(updatedMembers);
                setDisplayNewMemberForm(false);
                await saveMembersData(updatedMembers);
              }}
              onReject={() => setDisplayNewMemberForm(false)}
              isNew
              applicationId={id}
              memberTypeOptions={memberTypeOptions}
              members={members}
            />
          )}

          {members.length > 0 && (
            <PersonAccordion type="single" collapsible>
              <div className="grid gap-4">
                {members.map((member, index) => {
                  if (membersInEdit.includes(index)) {
                    return (
                      <EditMemberFormFields
                        key={index}
                        existingMember={member}
                        isNew={false}
                        applicationId={id}
                        memberTypeOptions={memberTypeOptions}
                        members={members}
                        onReject={() => {
                          setMembersInEdit(
                            membersInEdit.filter((val) => val !== index),
                          );
                        }}
                        onSuccess={async (member) => {
                          setMembersInEdit(
                            membersInEdit.filter((val) => val !== index),
                          );
                          const updatedMembers = [...members];
                          updatedMembers[index] = member;
                          setMembers(updatedMembers);
                          await saveMembersData(updatedMembers);
                        }}
                      />
                    );
                  }

                  return (
                    <PersonAccordionItem
                      key={index}
                      value={member.fullname || ''}
                    >
                      <PersonAccordionTrigger>
                        {member.fullname}
                      </PersonAccordionTrigger>
                      <PersonAccordionContent className="space-y-3">
                        <DataNode
                          orientation="horizontal"
                          label={t('MembersPage.idCode')}
                        >
                          {member.nationalIdCode ?? 'N/A'}
                        </DataNode>

                        <DataNode
                          orientation="horizontal"
                          label={t('MembersPage.gender')}
                        >
                          {member.gender ?? 'N/A'}
                        </DataNode>
                        <DataNode
                          orientation="horizontal"
                          label={t('MembersPage.phoneNumber')}
                        >
                          {member.phoneNumber ?? 'N/A'}
                        </DataNode>
                        <DataNode
                          orientation="horizontal"
                          label={t('MembersPage.capacity')}
                        >
                          {member.type ?? 'N/A'}
                        </DataNode>
                      </PersonAccordionContent>
                      <MemberAccordionFooter
                        onEdit={() => {
                          if (
                            memberTypeOptions &&
                            memberTypeOptions.length > 0
                          ) {
                            setMembersInEdit([...membersInEdit, index]);
                          } else {
                            alert(
                              'Cannot edit member: Member position types are currently unavailable. Please refresh the page and try again.',
                            );
                          }
                        }}
                        onRemove={() =>
                          handleMemberRemove(member.nationalIdCode)
                        }
                      />
                    </PersonAccordionItem>
                  );
                })}
              </div>
            </PersonAccordion>
          )}
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />

      <input type="hidden" name="members" value={JSON.stringify(members)} />

      <input type="hidden" name="redirectTo" value={nextUrl} />

      <ApplyFormActionBar
        disabled={isPending || !membersValidation.isValid}
        nextUrl={nextUrl}
        prevUrl={prevUrl}
      />
    </Form>
  );
};

interface MemberAccordionFooterProps {
  onRemove?: () => void;
  onEdit?: () => void;
}

const MemberAccordionFooter = ({
  onRemove,
  onEdit,
}: MemberAccordionFooterProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-row justify-center gap-8">
      <Button
        variant="ghost"
        asChild
        className="p-0 active:bg-transparent"
        onClick={onRemove}
      >
        <div>
          <Underline className="text-destructive border-b-destructive hover:text-destructive">
            <IconTrash className="!text-destructive" />
            {t('Common.remove')}
          </Underline>
        </div>
      </Button>
      <Button
        variant="ghost"
        asChild
        className="p-0 active:bg-transparent"
        onClick={onEdit}
      >
        <div>
          <Underline className="border-b-blue-400 text-blue-400">
            <IconPencil />
            {t('Common.edit')}
          </Underline>
        </div>
      </Button>
    </div>
  );
};

interface NewMemberFormFieldsProps {
  onSuccess: (member: Partial<Member>) => void;
  onReject: () => void;
  existingMember?: Partial<Member>;
  isNew: boolean; // differentiate between new and existing members for form fields
  applicationId?: string; // for file uploads
  memberTypeOptions?: TaxonomyOption[];
  members: Partial<Member>[];
  existingMembers?: { id: string; phoneNumber: string; nationalIdCode: string }[];
}

const EditMemberFormFields: FC<NewMemberFormFieldsProps> = ({
  onReject,
  onSuccess,
  existingMember,
  isNew,
  applicationId,
  memberTypeOptions,
  members,
  existingMembers = [],
}) => {
  const formInitialValues = {
    fullname: existingMember?.fullname,
    nationalIdCode: existingMember?.nationalIdCode,
    gender: existingMember?.gender,
    phoneNumber: existingMember?.phoneNumber,
    type: existingMember?.type,
    disability: existingMember?.disability ? ('on' as const) : null,
    certificateOfDisability:
      existingMember?.disability?.certificateOfDisability,
    pwdNumber: existingMember?.disability?.pwdNumber,
    photoOfId: existingMember?.photoOfId,
  };

  // Get the index of the current member being edited
  const currentMemberIndex = existingMember
    ? members.findIndex(
        (m) => m.nationalIdCode === existingMember.nationalIdCode,
      )
    : undefined;

  const [state] = useForm(memberAction, memberSchema, formInitialValues);
  const [withDisability, setWithDisability] = useState(
    existingMember?.disability?.certificateOfDisability ||
      existingMember?.disability?.pwdNumber
      ? true
      : false,
  );
  const [member, setMember] = useState<Partial<Member> | undefined>(
    existingMember,
  );
  const t = useTranslations();

  // Prevent editing if taxonomy data is not available
  if (!memberTypeOptions || memberTypeOptions.length === 0) {
    return (
      <div className="border-destructive grid gap-4 rounded-md border bg-destructive/5 p-4">
        <div className="text-destructive font-medium">
          Cannot {isNew ? 'add' : 'edit'} member: Member position types
          unavailable
        </div>
        <div className="text-destructive text-sm">
          Member position types could not be loaded. Please refresh the page and
          try again.
        </div>
        <div className="flex flex-row justify-center gap-8">
          <Button
            variant="ghost"
            asChild
            className="p-0 active:bg-transparent"
            onClick={onReject}
          >
            <div>
              <Underline className="text-destructive border-b-destructive">
                <IconX className="!text-destructive" />
                {t('Common.cancel')}
              </Underline>
            </div>
          </Button>
        </div>
      </div>
    );
  }

  const handleNationalIdChange = (value: string) => {
    // Validate national ID uniqueness
    if (value) {
      const nationalIdCheck = canAssignNationalId(
        value,
        members,
        existingMembers,
        existingMember?.id
      );
      if (!nationalIdCheck.canAssign) {
        console.warn(nationalIdCheck.reason);
      }
    }

    setMember((member) => ({
      ...member,
      nationalIdCode: value,
    }));
  };

  const handlePhoneNumberChange = (value: string) => {
    const phoneWithCountryCode = value ? `+254${value}` : '';
    
    if (phoneWithCountryCode) {
      const phoneCheck = canAssignPhoneNumber(
        phoneWithCountryCode,
        members,
        existingMembers,
        existingMember?.id
      );
      if (!phoneCheck.canAssign) {
        console.warn(phoneCheck.reason);
      }
    }

    setMember((member) => ({
      ...member,
      phoneNumber: phoneWithCountryCode,
    }));
  };

  
  const validateAllMembers = (members: Partial<Member>[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const phoneNumbers = new Set<string>();
    const nationalIds = new Set<string>();

    members.forEach((member, index) => {
      // Check for duplicate phone numbers
      if (member.phoneNumber) {
        if (phoneNumbers.has(member.phoneNumber)) {
          errors.push(`Phone number ${member.phoneNumber} is used by multiple members.`);
        } else {
          phoneNumbers.add(member.phoneNumber);
        }
      }

      // Check for duplicate national IDs
      if (member.nationalIdCode) {
        if (nationalIds.has(member.nationalIdCode)) {
          errors.push(`National ID ${member.nationalIdCode} is used by multiple members.`);
        } else {
          nationalIds.add(member.nationalIdCode);
        }
      }

      // Check required fields
      if (!member.fullname) {
        errors.push(`Member ${index + 1} is missing full name.`);
      }
      if (!member.nationalIdCode) {
        errors.push(`Member ${index + 1} is missing national ID.`);
      }
      if (!member.phoneNumber) {
        errors.push(`Member ${index + 1} is missing phone number.`);
      }
      if (!member.type) {
        errors.push(`Member ${index + 1} is missing position.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return (
    <div className="border-primary grid gap-4 rounded-md border bg-neutral-200 p-4">
      <Field
        state={state}
        name="fullname"
        label={t('MembersPage.memberName')}
        required
        control={(props) => (
          <Input
            {...props}
            defaultValue={member?.fullname}
            onValueChange={(value) => {
              const capitalizedValue = capitalizeWords(value);
              setMember((member) => ({
                ...member,
                fullname: capitalizedValue,
              }));
            }}
          />
        )}
      />

      <Field
        state={state}
        name="nationalIdCode"
        label={t('MembersPage.nationalIdCodeAlienId')}
        required
        control={(props) => (
          <Input
            {...props}
            defaultValue={member?.nationalIdCode}
            onValueChange={handleNationalIdChange}
          />
        )}
      />

      <Field
        state={state}
        name="gender"
        label={t('MembersPage.gender')}
        required
        control={(props) => (
          <RadioGroup
            {...props}
            defaultValue={member?.gender}
            onValueChange={(value: string) => {
              setMember((member) => ({
                ...member,
                gender: value as GenderType,
              }));
            }}
            options={[
              {
                label: t('MembersPage.male'),
                value: 'Male',
              },
              {
                label: t('MembersPage.female'),
                value: 'Female',
              },
              {
                label: t('Common.other'),
                value: 'Other',
              },
            ]}
          />
        )}
      />

      <Field
        state={state}
        name="phoneNumber"
        label={t('MembersPage.phoneNumber')}
        required
        control={(props) => (
          <Input
            type="tel"
            startDecorator="+254"
            {...props}
            defaultValue={member?.phoneNumber?.replace(/^\+254/, '')}
            onValueChange={(value) => handlePhoneNumberChange(value)}
          />
        )}
      />

      <Field
        state={state}
        name="type"
        label={t('MembersPage.positionOfMember')}
        required
        control={(props) => (
          <Select
            options={
              memberTypeOptions
                ? memberTypeOptions.map((option) => {
                    const assignmentCheck = canAssignRole(
                      option.value,
                      members,
                      memberTypeOptions,
                      currentMemberIndex,
                    );
                    return {
                      label: option.label,
                      value: option.value,
                      disabled: !assignmentCheck.canAssign,
                    };
                  })
                : []
            }
            {...props}
            defaultValue={member?.type}
            onValueChange={(value) => {
              // Check if the role can be assigned
              if (memberTypeOptions) {
                const assignmentCheck = canAssignRole(
                  value,
                  members,
                  memberTypeOptions,
                  currentMemberIndex,
                );
                if (!assignmentCheck.canAssign) {
                  alert(
                    assignmentCheck.reason || 'This role cannot be assigned.',
                  );
                  return;
                }
              }

              setMember((member) => ({
                ...member,
                type: value,
              }));
            }}
          />
        )}
      />

      <Field
        state={state}
        name="photoOfId"
        label={t('MembersPage.photoOfMemberId')}
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_ACCEPT}
            maxSize={MAX_FILE_SIZE}
            applicationId={applicationId}
            uploadAction={uploadSingleFileAction}
            onUploadComplete={(files) => {
              setMember((member) => ({
                ...member,
                photoOfId: {
                  fid: files[0]?.fid ? parseInt(files[0].fid, 10) : undefined,
                  filename: files[0]?.filename,
                  url: files[0]?.url,
                },
              }));
            }}
            {...props}
          />
        )}
        description={t('MembersPage.maxFileSize', {
          size: formatBytes(MAX_FILE_SIZE),
        })}
      />

      <Field
        state={state}
        name="disability"
        required
        control={(props) => (
          <Checkbox
            {...props}
            onValueChange={(value) => {
              setWithDisability(value);
              if (!value) {
                // Clear disability data when checkbox is unchecked
                setMember((member) => ({
                  ...member,
                  disability: undefined,
                }));
              } else {
                // Initialize disability object when checkbox is checked
                // Only initialize if there's no existing disability data
                if (!member?.disability) {
                  setMember((member) => ({
                    ...member,
                    disability: {
                      certificateOfDisability: {
                        fid: undefined,
                        filename: '',
                        url: '',
                      },
                      pwdNumber: '',
                    },
                  }));
                }
              }
            }}
            defaultValue={withDisability}
          >
            {t('MembersPage.personWithDisability')}
          </Checkbox>
        )}
      />

      {withDisability && (
        <div>
          <Field
            state={state}
            name="certificateOfDisability"
            label={t('MembersPage.certificateOfDisability')}
            required
            control={(props) => (
              <FileUploadInput
                accept={FILE_ACCEPT}
                maxSize={MAX_FILE_SIZE}
                applicationId={applicationId}
                uploadAction={uploadSingleFileAction}
                onUploadComplete={(files) => {
                  setMember((member) => ({
                    ...member,
                    disability: {
                      ...member?.disability,
                      certificateOfDisability: {
                        fid: files[0]?.fid
                          ? parseInt(files[0].fid, 10)
                          : undefined,
                        filename: files[0]?.filename,
                        url: files[0]?.url,
                      },
                    },
                  }));
                }}
                enableUpload={true}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="pwdNumber"
            label={t('MembersPage.pwdNumber')}
            control={(props) => (
              <Input
                {...props}
                defaultValue={member?.disability?.pwdNumber}
                onValueChange={(value) => {
                  setMember((member) => ({
                    ...member,
                    disability: {
                      certificateOfDisability: member?.disability
                        ?.certificateOfDisability || {
                        fid: undefined,
                        filename: '',
                        url: '',
                      },
                      pwdNumber: value,
                    },
                  }));
                }}
              />
            )}
          />
        </div>
      )}

      <div className="flex flex-row justify-center gap-8">
        <Button
          variant="ghost"
          type="button"
          className="p-0 active:bg-transparent"
          onClick={onReject}
        >
          <Underline className="text-destructive border-b-destructive hover:text-destructive">
            <IconX className="!text-destructive" />
            {t('Common.cancel')}
          </Underline>
        </Button>
        <Button
          variant="ghost"
          type="button"
          className="p-0 active:bg-transparent"
          onClick={() => {
            if (!member) return;

            // Transform member object to form data structure for validation
            const formDataForValidation = {
              fullname: member.fullname,
              nationalIdCode: member.nationalIdCode,
              gender: member.gender,
              type: member.type,
              phoneNumber: member.phoneNumber,
              photoOfId: member.photoOfId,
              disability: member.disability ? 'on' : null,
              certificateOfDisability: member.disability?.certificateOfDisability,
              pwdNumber: member.disability?.pwdNumber,
            };

            // Validate member data before saving
            const validationResult = memberSchema.safeParse(formDataForValidation);

            if (!validationResult.success) {
              const errors = validationResult.error.flatten().fieldErrors;
              const missingFields = [];
              if (errors.fullname) missingFields.push('Full Name');
              if (errors.nationalIdCode) missingFields.push('National ID');
              if (errors.gender) missingFields.push('Gender');
              if (errors.type) missingFields.push('Position');
              if (errors.phoneNumber) missingFields.push('Phone Number');
              if (errors.photoOfId) missingFields.push('Photo of ID');

              alert(`Please fill the required fields: ${missingFields.join(', ')}`);
              return;
            }

            // Enhanced validation: Check for duplicates in current members array
            // For new members, check if phone/nationalId already exists in the current members list
            // For existing members, check if phone/nationalId exists in other members (not themselves)
            
            // Check for duplicate phone number in current members
            if (member.phoneNumber) {
              const duplicatePhoneMember = members.find(m => 
                m.phoneNumber === member.phoneNumber && 
                // For existing members, exclude themselves; for new members, check all
                (isNew ? true : m.nationalIdCode !== existingMember?.nationalIdCode)
              );
              
              if (duplicatePhoneMember) {
                alert(`Phone number ${member.phoneNumber} is already used by ${duplicatePhoneMember.fullname || 'another member'}. Each member must have a unique phone number.`);
                return;
              }
            }

            // Check for duplicate national ID in current members
            if (member.nationalIdCode) {
              const duplicateNationalIdMember = members.find(m => 
                m.nationalIdCode === member.nationalIdCode && 
                // For existing members, exclude themselves; for new members, check all
                (isNew ? true : m.nationalIdCode !== existingMember?.nationalIdCode)
              );
              
              if (duplicateNationalIdMember) {
                alert(`National ID ${member.nationalIdCode} is already used by ${duplicateNationalIdMember.fullname || 'another member'}. Each member must have a unique National ID.`);
                return;
              }
            }

            // Additional database-level validation (existing members check)
            if (member.nationalIdCode) {
              const nationalIdCheck = canAssignNationalId(
                member.nationalIdCode,
                members,
                existingMembers || [],
                existingMember?.id
              );
              if (!nationalIdCheck.canAssign) {
                alert(nationalIdCheck.reason);
                return;
              }
            }

            // Additional phone number validation
            if (member.phoneNumber) {
              const phoneCheck = canAssignPhoneNumber(
                member.phoneNumber,
                members,
                existingMembers || [],
                existingMember?.id
              );
              if (!phoneCheck.canAssign) {
                alert(phoneCheck.reason);
                return;
              }
            }

            // Additional role validation
            if (memberTypeOptions && member.type) {
              const assignmentCheck = canAssignRole(
                member.type,
                members,
                memberTypeOptions,
                currentMemberIndex,
              );
              if (!assignmentCheck.canAssign) {
                alert(assignmentCheck.reason || 'This role cannot be assigned.');
                return;
              }
            }

            onSuccess(member);
          }}
        >
          <Underline className="border-b-green-400 text-green-400">
            <IconCheck className="!text-green-400" />
            {t('Common.confirm')}
          </Underline>
        </Button>
      </div>
    </div>
  );
};
