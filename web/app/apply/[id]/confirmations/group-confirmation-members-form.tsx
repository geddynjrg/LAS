'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  type GroupMembersConfirmationData,
  groupMembersConfirmationDataSchema,
} from '@/app/apply/[id]/confirmations/group-members-confirmation-schema';
import type { Member } from '@/lib/data/application';
import { IconCheck } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Container } from '@workspace/ui/components/container';
import { DataNode } from '@workspace/ui/components/data-node';
import { DataPair } from '@workspace/ui/components/data-pair';
import { Field, Form } from '@workspace/ui/components/form';
import { Card } from '@workspace/ui/components/uwezo/card';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

export interface GroupConfirmationMembersFormProps {
  id: string;
  action: FormAction<GroupMembersConfirmationData>;
  onBack: () => void;
  members: Member[];
}

export const GroupConfirmationMembersForm: FC<
  GroupConfirmationMembersFormProps
> = ({ id, action, members }) => {
  const [state, formAction, isPending] = useForm(
    action,
    groupMembersConfirmationDataSchema,
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<Map<string, boolean>>(
    new Map(),
  );
  const t = useTranslations();
  const [membersList, setMembersList] = useState<Member[]>(members);

  // Manage confirmation state after successful submission
  useEffect(() => {
    if (state.success) {
      setMembersList(Array.isArray(state?.members) ? state.members : []);
    }
  }, [state, membersList]);

  // Initialize members with existing confirmed status
  useEffect(() => {
    const confirmedMemberIds: string[] = [];

    // Initialize checkbox states
    const initialStates = new Map<string, boolean>();
    members.forEach((member, index) => {
      const memberId = `${member.nationalIdCode ?? `member-${index}`}-${index}`;
      const isConfirmed = member.requiresConfirmation || false;

      if (isConfirmed) {
        confirmedMemberIds.push(memberId);
      }

      initialStates.set(memberId, isConfirmed);
    });

    setSelectedMembers(confirmedMemberIds);
    setCheckboxStates(initialStates);
  }, [members]);

  // Handle select all functionality
  const handleSelectAll = () => {
    const newStates = new Map<string, boolean>();

    if (selectedMembers.length === membersList.length) {
      // Deselect all
      setSelectedMembers([]);
      membersList.forEach((member, index) => {
        const memberId = `${member.nationalIdCode ?? `member-${index}`}-${index}`;
        newStates.set(memberId, false);
      });
    } else {
      // Select all
      const allMemberIds = membersList.map(
        (member, index) =>
          `${member.nationalIdCode ?? `member-${index}`}-${index}`,
      );
      setSelectedMembers(allMemberIds);
      membersList.forEach((member, index) => {
        const memberId = `${member.nationalIdCode ?? `member-${index}`}-${index}`;
        newStates.set(memberId, true);
      });
    }

    setCheckboxStates(newStates);
  };

  // Handle individual member selection
  const handleMemberSelection = (memberId: string, isSelected: boolean) => {
    const newStates = new Map(checkboxStates);
    newStates.set(memberId, isSelected);
    setCheckboxStates(newStates);

    if (isSelected) {
      const newSelectedList = [...selectedMembers, memberId];
      setSelectedMembers(newSelectedList);
    } else {
      const newSelectedList = selectedMembers.filter((id) => id !== memberId);
      setSelectedMembers(newSelectedList);
    }
  };

  return (
    <Form
      action={formAction}
      autoComplete="on"
      className={cn('grow-1 flex flex-col justify-between')}
    >
      <Container className={cn('space-y-8')}>
        <FormCard
          title={t('ConfirmationsPage.form-title-group')}
          className="space-y-4"
        >
          <Card variant="blue" className={cn('text-sm')}>
            {t(
              'ConfirmationsPage.groupConfirmationForm.confirmation-instructions',
            )}
          </Card>

          <h5 className={cn('typo-h5')}>
            {t('ConfirmationsPage.groupConfirmationForm.select-members')}
          </h5>

          <div className={cn('max-sm:flex max-sm:justify-center')}>
            <Button
              className={cn('max-sm:w-full max-sm:max-w-[27rem]')}
              variant="secondary"
              type="button"
              onClick={handleSelectAll}
            >
              {selectedMembers.length === membersList.length
                ? t('ConfirmationsPage.groupConfirmationForm.deselect-all')
                : t('ConfirmationsPage.groupConfirmationForm.select-all')}
            </Button>
          </div>

          <div className={cn('space-y-3')}>
            {membersList.map((member, index) => {
              const memberId = `${member.nationalIdCode ?? `member-${index}`}-${index}`;
              const isSelected = checkboxStates.get(memberId) ?? false;

              return (
                <DataPair
                  key={`member-${member.nationalIdCode || member.fullname || index}-${index}`}
                  className={cn(
                    'w-full',
                    'border-t border-solid border-neutral-400',
                    'pt-3',
                  )}
                >
                  <div className="flex-1">
                    <Field
                      name={`member_${member.nationalIdCode || index}`}
                      control={(props) => (
                        <Checkbox
                          {...props}
                          key={`checkbox-${memberId}-${isSelected ? 'checked' : 'unchecked'}`}
                          defaultValue={isSelected}
                          onValueChange={(value) => {
                            handleMemberSelection(memberId, !!value);
                          }}
                        >
                          <DataNode
                            label={member.fullname ?? ''}
                            key={`datanode-${member.nationalIdCode || index}-${index}`}
                          >
                            {member.type}
                          </DataNode>
                        </Checkbox>
                      )}
                    />
                  </div>
                  {isSelected && (
                    <IconCheck
                      key={`check-${member.nationalIdCode || index}-${index}`}
                      className={cn('text-green-400', 'h-8 w-8')}
                    />
                  )}
                </DataPair>
              );
            })}
          </div>
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />
      <input
        type="hidden"
        name="selectedMembers"
        value={JSON.stringify(selectedMembers)}
      />
      <input type="hidden" name="redirectTo" value={`/apply/${id}/review`} />

      <ApplyFormActionBar
        disabled={isPending || selectedMembers.length === 0}
        nextUrl={`/apply/${id}/review`}
        prevUrl={`/apply/${id}/proposed-business`}
      />
    </Form>
  );
};
