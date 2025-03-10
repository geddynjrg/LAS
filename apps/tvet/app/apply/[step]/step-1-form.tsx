"use client";

import { type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import { Select } from "@workspace/ui/components/select";
import { useForm } from "@workspace/ui/hooks/use-form";

import { applyStep1 } from "@/actions/apply-step-1";
import { applyStep1Schema } from "@/actions/apply-step-1-schema";

export const Step1Form: FC = () => {
  const [state, formAction, isPending] = useForm(applyStep1, applyStep1Schema, {
    firstName: "Test first name",
  });

  console.log("state", state);

  return (
    <div>
      {state.success && (
        <Alert variant="success" className="mb-4">
          Form submitted!!
        </Alert>
      )}
      {state?.errors && (
        <Alert variant="error" className="mb-4">
          Please fix errors
          <pre>{JSON.stringify(state.errors, null, 2)}</pre>
        </Alert>
      )}

      <Form action={formAction} className="space-y-6" autoComplete="on">
        <Field
          state={state}
          name="firstName"
          label="First Name"
          required
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="middleName"
          label="Middle Name"
          description="This is the middle name"
          control={(props) => <Input {...props} />}
        />

        <Field
          state={state}
          name="surname"
          label="Surname"
          required
          control={(props) => (
            <Select
              options={[
                { label: "Option 1", value: "1" },
                { label: "Option 2", value: "2" },
              ]}
              {...props}
            />
          )}
        />

        <Field
          state={state}
          name="radioGroup"
          label="Radio group label"
          required
          control={(props) => (
            <RadioGroup
              {...props}
              options={[
                { label: "Option 1", value: "1" },
                { label: "Option 2", value: "2" },
                { label: "Option 3", value: "3" },
              ]}
            />
          )}
          description="This is a description for the radio group field"
        />

        <SubmitButton disabled={isPending}>Submit</SubmitButton>
      </Form>
    </div>
  );
};
