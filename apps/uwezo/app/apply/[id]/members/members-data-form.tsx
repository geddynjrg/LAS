"use client";

import {
  IconCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

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

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { memberAction } from "@/app/apply/[id]/members/member-action";
import { memberSchema } from "@/app/apply/[id]/members/member-schema";
import {
  membersDataSchema,
  type MembersData,
} from "@/app/apply/[id]/members/members-data-schema";
import { MAX_FILE_SIZE } from "@/lib/constants";
import {
  MembersData as ApplicationMembersData,
  type GenderType,
  type Member,
} from "@/lib/data/application";
import { dummyMembers } from "@/lib/data/dummy-data";

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
  const t = useTranslations();
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
    <Form
      action={formAction}
      className="grow-1 flex flex-col justify-between space-y-6"
      autoComplete="on"
    >
      <Container>
        <FormCard title={t("MembersPage.member")} className="mt-7 grid gap-4">
          <Field
            className="border-b border-neutral-400 pb-4"
            state={state}
            name="natureOfGroup"
            label={t("MembersPage.natureOfTheGroup")}
            required
            control={(props) => (
              <ButtonGroup {...props} type="single" className="flex flex-row">
                <ButtonGroupItem
                  value="youth"
                  className="typo-body-small-bold grow px-1"
                >
                  {t("MembersPage.youth")}
                </ButtonGroupItem>
                <ButtonGroupItem
                  value="People with disabilities"
                  className="typo-body-small-bold grow px-1"
                >
                  {t("MembersPage.peopleWithDisabilities")}
                </ButtonGroupItem>
                <ButtonGroupItem
                  value="Woman"
                  className="typo-body-small-bold grow px-1"
                >
                  {t("MembersPage.women")}
                </ButtonGroupItem>
              </ButtonGroup>
            )}
          />

          <div>
            <div className="font-bold">
              {t("MembersPage.searchForMember")}
              <span className="text-destructive">*</span>
            </div>
            <SearchInput
              defaultValue=""
              placeholder={t("MembersPage.enterNameOrNationalId")}
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
            <IconPlus /> {t("MembersPage.addMember")}
          </Button>
          <p className="typo-body-large mx-auto font-bold">
            {t("MembersPage.membersInfoInserted", { count: members.length })}
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
                        <DataNode
                          orientation="horizontal"
                          label={t("MembersPage.idCode")}
                        >
                          {member.nationalIdCode ?? "N/A"}
                        </DataNode>

                        <DataNode
                          orientation="horizontal"
                          label={t("MembersPage.gender")}
                        >
                          {member.gender ?? "N/A"}
                        </DataNode>
                        <DataNode
                          orientation="horizontal"
                          label={t("MembersPage.phoneNumber")}
                        >
                          {member.phoneNumber ?? "N/A"}
                        </DataNode>
                        <DataNode
                          orientation="horizontal"
                          label={t("MembersPage.capacity")}
                        >
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
            {t("Common.remove")}
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
            {t("Common.edit")}
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
}

const EditMemberFormFields: FC<NewMemberFormFieldsProps> = ({
  onReject,
  onSuccess,
  existingMember,
  isNew,
}) => {
  const [state] = useForm(memberAction, memberSchema, {
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
  const t = useTranslations();

  return (
    <div className="border-primary grid gap-4 rounded-md border bg-neutral-200 p-4">
      <Field
        state={state}
        name="fullname"
        label={t("MembersPage.memberName")}
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
        label={t("MembersPage.nationalIdCodeAlienId")}
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
        label={t("MembersPage.gender")}
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
            <ButtonGroupItem value="Male">
              {t("MembersPage.male")}
            </ButtonGroupItem>
            <ButtonGroupItem value="Female">
              {t("MembersPage.female")}
            </ButtonGroupItem>
            <ButtonGroupItem value="Other">{t("Common.other")}</ButtonGroupItem>
          </ButtonGroup>
        )}
      />
      <Field
        name="phone"
        label={t("MembersPage.phoneNumber")}
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
        label={t("MembersPage.positionOfMember")}
        required
        control={(props) => (
          <Select
            options={[
              {
                label: t("ApplicationDetailsPage.members.chairman"),
                value: "Chairman",
              },
              {
                label: t("ApplicationDetailsPage.members.secretary"),
                value: "Secretary",
              },
              {
                label: t("ApplicationDetailsPage.members.member"),
                value: "Member",
              },
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
        label={t("MembersPage.photoOfMemberId")}
        required
        control={(props) => (
          <FileUploadInput
            accept={{
              "image/*": [".jpg", ".png"],
              "application/pdf": [".pdf"],
            }}
            maxSize={MAX_FILE_SIZE}
            attachmentBgInverted
            {...props}
            /* TODO: On value change might be needed here */
          />
        )}
        description={t("MembersPage.maxFileSize", {
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
            onValueChange={(value) => setWithDisability(value)}
            defaultValue={withDisability}
          >
            {t("MembersPage.personWithDisability")}
          </Checkbox>
        )}
      />

      {withDisability && (
        <div>
          <Field
            state={state}
            name="certificateOfDisability"
            label={t("MembersPage.certificateOfDisability")}
            required
            control={(props) => (
              <FileUploadInput
                accept={{
                  "image/*": [".jpg", ".png"],
                  "application/pdf": [".pdf"],
                }}
                maxSize={MAX_FILE_SIZE}
                attachmentBgInverted
                {...props}
              />
            )}
          />

          <Field
            state={state}
            name="pwdNumber"
            label={t("MembersPage.pwdNumber")}
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
              {t("Common.cancel")}
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
              {t("Common.confirm")}
            </Underline>
          </div>
        </Button>
      </div>
    </div>
  );
};
