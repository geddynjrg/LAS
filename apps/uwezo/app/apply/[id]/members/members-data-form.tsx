"use client";

import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { FC, useEffect, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { Container } from "@workspace/ui/components/container";
import { DataNode } from "@workspace/ui/components/data-node";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Underline } from "@workspace/ui/components/underline";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import {
  PersonAccordion,
  PersonAccordionContent,
  PersonAccordionItem,
  PersonAccordionTrigger,
} from "@workspace/ui/components/uwezo/personAccordion";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

import { type Member } from "@/actions/application";
import {
  membersDataSchema,
  type MembersData,
} from "@/actions/apply-form/members-data-schema";
import { member } from "@/actions/member";
import { memberSchema } from "@/actions/member-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { dummyMembers } from "@/lib/dummy-data";

export interface MembersDataProps {
  id: string;
  action: FormAction<MembersData>;
}

export const MembersDataForm: FC<MembersDataProps> = ({ action, id }) => {
  const [state, formAction, isPending] = useForm(action, membersDataSchema);
  const [members, setMembers] = useState<Partial<Member>[]>([]);

  useEffect(() => {
    console.log(members);
  }, [members]);

  const prevUrl = `/apply/${id}/group-data`;
  const nextUrl = `/apply/${id}/loan-conditions`;

  const handleMemberRemove = (id: string | undefined) => {
    if (!id) {
      return;
    }

    setMembers((members) =>
      members.filter((member) => member.nationalIdCode !== id),
    );
  };

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      <Container>
        <FormCard title="Group basics" className="mt-7 grid gap-4">
          <Field
            className="border-b border-neutral-400 pb-4"
            state={state}
            name="natureOfGroup"
            label="Nature of group"
            required
            control={(props) => (
              <ButtonGroup {...props} type="single">
                <ButtonGroupItem value="youth">Youth</ButtonGroupItem>
                <ButtonGroupItem value="People with disabilities">
                  People with disabilities
                </ButtonGroupItem>
                <ButtonGroupItem value="Woman">Women</ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <div>
            <div className="font-bold">
              Search for member<span className="text-destructive">*</span>
            </div>
            <SearchInput
              defaultValue=""
              placeholder="Enter name or national ID number"
              options={dummyMembers.map((member) => ({
                label: member.fullname,
                value: member.nationalIdCode,
              }))}
              clearOnSelect
              onValueSelect={(value) => {
                const selectedMember = dummyMembers.find(
                  (member) => member.nationalIdCode === value,
                );

                // prevent duplicate members
                if (
                  members.find(
                    (member) =>
                      member.nationalIdCode === selectedMember?.nationalIdCode,
                  )
                ) {
                  return;
                }

                setMembers([
                  ...members,
                  {
                    ...selectedMember,
                  },
                ]);
              }}
            />
          </div>
          <Button variant="secondary">
            <IconPlus /> Add member manually
          </Button>
          <p className="typo-body-large mx-auto font-bold">
            0 members info inserted
          </p>

          {members.length > 0 && (
            <PersonAccordion type="single" collapsible>
              <div className="grid gap-4">
                {members.map((member) => (
                  <PersonAccordionItem
                    key={member.nationalIdCode}
                    value={member.fullname || ""}
                  >
                    <PersonAccordionTrigger>
                      {member.fullname}
                    </PersonAccordionTrigger>
                    <PersonAccordionContent className="space-y-3">
                      <DataNode orientation="horizontal" label="Id code">
                        {member.nationalIdCode ?? "N/A"}
                      </DataNode>
                      <DataNode orientation="horizontal" label="Gender">
                        {member.gender ?? "N/A"}
                      </DataNode>
                      <DataNode orientation="horizontal" label="Phone nr.">
                        {member.phoneNumber ?? "N/A"}
                      </DataNode>
                      <DataNode orientation="horizontal" label="Capacity">
                        {member.type ?? "N/A"}
                      </DataNode>
                    </PersonAccordionContent>
                    <MemberAccordionFooter
                      onRemove={() => handleMemberRemove(member.nationalIdCode)}
                    />
                  </PersonAccordionItem>
                ))}
              </div>
            </PersonAccordion>
          )}

          <NewMemberFormFields onSuccess={() => {}} onReject={() => {}} />
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

interface MemberAccordionFooterProps {
  onRemove?: () => void;
  onEdit?: () => void;
}

const MemberAccordionFooter = ({
  onRemove,
  onEdit,
}: MemberAccordionFooterProps) => (
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
          Remove
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
          Edit
        </Underline>
      </div>
    </Button>
  </div>
);

interface NewMemberFormFieldsProps {
  onSuccess: (data: Member) => void;
  onReject: () => void;
}

const NewMemberFormFields: FC<NewMemberFormFieldsProps> = ({
  onReject,
  onSuccess,
}) => {
  const [state, formAction, isPending] = useForm(member, memberSchema);

  return (
    <div className="border-primary grid gap-4 rounded-md border bg-neutral-200 p-4">
      <Form action={formAction} autoComplete="on">
        <Field
          state={state}
          name="fullname"
          label="Member name"
          required
          control={(props) => (
            <Input
              {...props}
              placeholder="Enter member name"
              className="w-full"
            />
          )}
        />

        <Field
          state={state}
          name="nationalIdCode"
          label="National ID code/Alien ID"
          required
          control={(props) => (
            <Input
              {...props}
              placeholder="Enter national ID code or alien ID"
              className="w-full"
            />
          )}
        />
      </Form>
    </div>
  );
};
