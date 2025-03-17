"use client";

import { IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState, type FC } from "react";

import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import { Container } from "@workspace/ui/components/container";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { SearchInput } from "@workspace/ui/components/search-input";
import { Underline } from "@workspace/ui/components/underline";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

import {
  groupDataSchema,
  type GroupData,
} from "@/actions/apply-form/group-data-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { dummyCounty } from "@/lib/dummy-data";

export interface GroupDataProps {
  id: string;
  action: FormAction<GroupData>;
}

export const GroupDataForm: FC<GroupDataProps> = ({ action, id }) => {
  const [state, formAction, isPending] = useForm(action, groupDataSchema);
  const [chosenCounty, setChosenCounty] = useState(
    state.values?.countyOfOperation,
  );
  const [chosenKeyActivities, setChosenKeyActivities] = useState(
    state.values?.groupActivities,
  );

  const prevUrl = `/apply`;
  const nextUrl = `/apply/${id}/members`;

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      <Container>
        <FormCard title="Group basics" className="mt-7 grid gap-4">
          <Field
            state={state}
            name="groupName"
            label={"Group name"}
            required
            control={(props) => <Input placeholder="Enter name" {...props} />}
          />
          <Field
            state={state}
            name="groupRegistrationNumber"
            label={"Group registration number"}
            required
            control={(props) => (
              <Input type="tel" placeholder="Registration number" {...props} />
            )}
          />
          <Field
            label="Date registered"
            name="dateFormed"
            required
            control={(props) => (
              <DatePicker placeholder="dd.mm.yyyy" {...props} />
            )}
            state={state}
          />

          {/* TODO: Add image upload and file upload here when components ready */}

          <Field
            state={state}
            name="groupRegistrationCertificate"
            label="Group registration certificate"
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
            name="listOfMembersOnCertificate"
            label="List of members on certificate"
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
        </FormCard>

        <FormCard title="Group background" className="mt-7 grid gap-4">
          <Field
            state={state}
            name="groupPurpose"
            label={"Group background"}
            required
            control={() => (
              <CheckboxGroup
                options={[
                  {
                    label: "Welfare issues",
                    value: "Welfare issues",
                  },
                  {
                    label: "Income generating activities",
                    value: "Income generating activities",
                  },
                  {
                    label: "Other",
                    value: "Other",
                  },
                ]}
                orientation="vertical"
              />
            )}
          />

          <Field
            state={state}
            name="groupActivities"
            label={"Key activities of the group"}
            required
            control={() => (
              <CheckboxGroup
                onValueChange={(val) => {
                  setChosenKeyActivities(val);
                }}
                options={[
                  {
                    label: "Value chain",
                    value: "Value chain",
                  },
                  {
                    label: "Table banking",
                    value: "Table banking",
                  },
                  {
                    label: "Other",
                    value: "Other",
                  },
                ]}
                orientation="vertical"
              />
            )}
          />

          {chosenKeyActivities?.includes("Value chain") && (
            <Field
              state={state}
              name="valueChain"
              label="Value chain"
              required
              control={(props) => (
                <CheckboxGroup
                  options={[
                    {
                      label: "Leather and leather products",
                      value: "Leather and leather products",
                    },
                    {
                      label: "Cotton and textiles",
                      value: "Cotton and textiles",
                    },
                    {
                      label: "Blue economy",
                      value: "Blue economy",
                    },
                    {
                      label: "Edible oils",
                      value: "Edible oils",
                    },
                    {
                      label: "Construction and building materials",
                      value: "Construction and building materials",
                    },
                    {
                      label: "Dairy and dairy products",
                      value: "Dairy and dairy products",
                    },
                  ]}
                  orientation="vertical"
                />
              )}
            />
          )}
          {chosenKeyActivities?.includes("Table banking") && (
            <div>
              <Field
                state={state}
                name="tableBankingExperience"
                label="How long has the group practiced table banking?"
                required
                control={(_props) => <Input type="number" />}
              />
              <Field
                state={state}
                name="tableBankingShareContribution"
                label="Total monthly share contribution"
                required
                control={(_props) => <Input type="number" />}
              />
              <Field
                state={state}
                name="tableBankingTotalLoanedOut"
                label="Total amount loaned out"
                required
                control={(_props) => <Input type="number" endDecorator="KSh" />}
              />
              <Field
                state={state}
                name="tableBankingTotalRevolvingFund"
                label="Total revolving fund"
                required
                control={(_props) => <Input type="number" endDecorator="KSh" />}
              />
            </div>
          )}
          {chosenKeyActivities?.includes("Other") && (
            <Field
              state={state}
              name="other"
              label="Specify"
              required
              control={(props) => <Input {...props} />}
            />
          )}
          <Field
            state={state}
            name="groupCreditHistory"
            label="Group credit history"
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

          <Link href="#">
            <Underline
              variant="primary"
              className="text-primary hover:cursor-pointer"
            >
              <p className="mt-4 flex items-center gap-1">
                <IconInfoCircle />
                Which documents can be used to show group credit history?
              </p>
            </Underline>
          </Link>
        </FormCard>

        <FormCard
          title="Location of the group"
          subtitle="The relevant sub-county chief will be contacted for a referral for the group"
          className="mt-7 grid gap-4"
        >
          <Field
            state={state}
            name="countyOfOperation"
            label="County of Operation"
            required
            control={(props) => (
              <SearchInput
                {...props}
                onValueChange={setChosenCounty}
                placeholder="Choose or search"
                options={dummyCounty.map((county) => ({
                  label: county.name,
                  value: county.name,
                }))}
              />
            )}
          />
          {/* TODO: clear value when county changes */}
          <Field
            state={state}
            name="constituency"
            label="Constituency"
            required
            control={(props) => (
              <SearchInput
                {...props}
                placeholder="Choose or search"
                options={dummyCounty
                  .find((county) => county.name === chosenCounty)
                  ?.constituencies.map((c) => ({
                    label: c,
                    value: c,
                  }))}
              />
            )}
          />

          <Field
            state={state}
            name="ward"
            label={"Ward"}
            required
            control={(props) => <Input placeholder="Enter ward" {...props} />}
          />

          <Field
            state={state}
            name="meetingPoint"
            label={"Meeting Point/Physical location/Village"}
            control={(props) => (
              <Input placeholder="e.g. social hall, school, etc." {...props} />
            )}
          />

          <Field
            state={state}
            name="nearestLandmark"
            label={"Nearest landmark"}
            control={(props) => (
              <Input placeholder="e.g. school, mosque, church" {...props} />
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
