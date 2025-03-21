"use client";

import {
  IconCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { FC, useEffect, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  ButtonGroup,
  ButtonGroupItem,
} from "@workspace/ui/components/button-group";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Container } from "@workspace/ui/components/container";
import { DataNode } from "@workspace/ui/components/data-node";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Select } from "@workspace/ui/components/select";
import { Underline } from "@workspace/ui/components/underline";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import {
  PersonAccordion,
  PersonAccordionContent,
  PersonAccordionItem,
  PersonAccordionTrigger,
} from "@workspace/ui/components/uwezo/personAccordion";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { formatBytes } from "@workspace/ui/lib/utils";

import {
  MembersData as ApplicationMembersData,
  type GenderType,
  type Member,
} from "@/actions/application";
import {
  membersDataSchema,
  type MembersData,
} from "@/actions/apply-form/members-data-schema";
import { memberAction } from "@/actions/member";
import { memberSchema } from "@/actions/member-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { dummyMembers } from "@/lib/dummy-data";

export interface MembersDataProps {
  id: string;
  action: FormAction<MembersData>;
  applicationMembersData?: ApplicationMembersData;
}

export const MembersDataForm: FC<MembersDataProps> = ({
  action,
  id,
  applicationMembersData,
}) => {
  const [state, formAction, isPending] = useForm(action, membersDataSchema, {
    natureOfGroup: applicationMembersData?.natureOfTheGroup,
  });
  const [members, setMembers] = useState<Partial<Member>[]>(
    applicationMembersData?.members ?? [],
  );
  const [displayNewMemberForm, setDisplayNewMemberForm] = useState(false);
  const [membersInEdit, setMembersInEdit] = useState<number[]>([]);

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
                label: member.fullname ?? "N/A",
                value: member.nationalIdCode ?? "N/A",
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
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              !displayNewMemberForm && setDisplayNewMemberForm(true)
            }
          >
            <IconPlus /> Add member manually
          </Button>
          <p className="typo-body-large mx-auto font-bold">
            {members.length} members info inserted
          </p>

          {displayNewMemberForm && (
            <EditMemberFormFields
              onSuccess={(member) => {
                setMembers([...members, member]);
                setDisplayNewMemberForm(false);
              }}
              onReject={() => setDisplayNewMemberForm(false)}
              isNew
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
                        onReject={() => {
                          setMembersInEdit(
                            membersInEdit.filter((val) => val !== index),
                          );
                        }}
                        onSuccess={(member) => {
                          setMembersInEdit(
                            membersInEdit.filter((val) => val !== index),
                          );
                          setMembers((members) => {
                            const newMembers = [...members];
                            newMembers[index] = member;

                            return newMembers;
                          });
                        }}
                      />
                    );
                  }

                  return (
                    <PersonAccordionItem
                      key={index}
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
                        onEdit={() => {
                          setMembersInEdit([...membersInEdit, index]);
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
  onSuccess: (member: Partial<Member>) => void;
  onReject: () => void;
  existingMember?: Partial<Member>;
  isNew: boolean; // differentiate between new and existing members for form fields
}

const EditMemberFormFields: FC<NewMemberFormFieldsProps> = ({
  onReject,
  onSuccess,
  existingMember,
  isNew,
}) => {
  const [state, formAction, isPending] = useForm(memberAction, memberSchema, {
    fullname: existingMember?.fullname,
    nationalIdCode: existingMember?.nationalIdCode,
    gender: existingMember?.gender,
    phoneNumber: existingMember?.phoneNumber,
    type: existingMember?.type,
    disability: existingMember?.disability ? "on" : null,
    certificateOfDisability:
      existingMember?.disability?.certificateOfDisability,
    pwdNumber: existingMember?.disability?.pwdNumber,
  });
  const [withDisability, setWithDisability] = useState(false);
  const [member, setMember] = useState<Partial<Member> | undefined>(
    existingMember,
  );

  return (
    <div className="border-primary grid gap-4 rounded-md border bg-neutral-200 p-4">
      <Field
        state={state}
        name="fullname"
        label="Member name"
        required
        editable={isNew}
        control={(props) => (
          <Input
            {...props}
            defaultValue={member?.fullname}
            onValueChange={(value) => {
              setMember((member) => ({
                ...member,
                fullname: value,
              }));
            }}
          />
        )}
      />

      <Field
        state={state}
        name="nationalIdCode"
        label="National ID code/Alien ID"
        required
        editable={isNew}
        control={(props) => (
          <Input
            {...props}
            defaultValue={member?.nationalIdCode}
            onValueChange={(value) => {
              setMember((member) => ({
                ...member,
                nationalIdCode: value,
              }));
            }}
          />
        )}
      />

      <Field
        state={state}
        name="gender"
        label="Gender"
        required
        editable={isNew}
        control={(props) => (
          <ButtonGroup
            {...props}
            defaultValue={member?.gender}
            type="single"
            onValueChange={(value) => {
              setMember((member) => ({
                ...member,
                gender: value as GenderType,
              }));
            }}
          >
            <ButtonGroupItem value="Male">Male</ButtonGroupItem>
            <ButtonGroupItem value="Female">Female</ButtonGroupItem>
            <ButtonGroupItem value="Other">Other</ButtonGroupItem>
          </ButtonGroup>
        )}
      />
      <Field
        name="phone"
        label="Phone number"
        required
        control={(props) => (
          <Input
            type="tel"
            startDecorator="+254"
            {...props}
            defaultValue={member?.phoneNumber}
            onValueChange={(value) => {
              setMember((member) => ({
                ...member,
                phoneNumber: value,
              }));
            }}
          />
        )}
      />

      <Field
        name="position"
        label="Position of member"
        required
        control={(props) => (
          <Select
            options={[
              { label: "Chairman", value: "Chairman" },
              { label: "Secretary", value: "Secretary" },
              { label: "Member", value: "Member" },
            ]}
            {...props}
            defaultValue={member?.type}
            onValueChange={(value) => {
              setMember((member) => ({
                ...member,
                type: value,
              }));
            }}
          />
        )}
      />

      <Field
        name="photo"
        label="Photo of member ID"
        required
        control={(props) => (
          <FileUploadInput
            accept={{
              "image/*": [".jpg", ".png"],
              "application/pdf": [".pdf"],
            }}
            maxSize={MAX_FILE_SIZE}
            {...props}
            /* TODO: On value change might be needed here */
          />
        )}
        description={`Max file size ${formatBytes(MAX_FILE_SIZE)}`}
      />

      <Field
        state={state}
        name="disability"
        required
        control={(props) => (
          <Checkbox
            {...props}
            onValueChange={(value) => setWithDisability(value)}
            defaultValue={withDisability}
          >
            Person with disability
          </Checkbox>
        )}
      />

      {withDisability && (
        <div>
          <Field
            state={state}
            name="certificateOfDisability"
            label="Certificate of disability"
            required
            control={(props) => (
              <FileUploadInput
                accept={{
                  "image/*": [".jpg", ".png"],
                  "application/pdf": [".pdf"],
                }}
                maxSize={MAX_FILE_SIZE}
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="pwdNumber"
            label="PWD number"
            control={(props) => (
              <Input
                {...props}
                defaultValue={member?.disability?.pwdNumber}
                onValueChange={(value) => {
                  setMember((member) => ({
                    ...member,
                    disability: {
                      certificateOfDisability: "", // TODO: sort this out when file upload can handle onValueChange
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
          asChild
          className="p-0 active:bg-transparent"
          onClick={onReject}
        >
          <div>
            <Underline className="text-destructive border-b-destructive hover:text-destructive">
              <IconX className="!text-destructive" />
              Cancel
            </Underline>
          </div>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="p-0 active:bg-transparent"
          onClick={() => member && onSuccess(member)}
        >
          <div>
            <Underline className="border-b-green-400 text-green-400">
              <IconCheck className="!text-green-400" />
              Confirm
            </Underline>
          </div>
        </Button>
      </div>
    </div>
  );
};
