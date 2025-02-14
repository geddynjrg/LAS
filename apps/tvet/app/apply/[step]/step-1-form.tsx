"use client";

import { useActionState, type FC } from "react";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select } from "@workspace/ui/components/select";

import { applyStep1, type ApplyStep1Response } from "@/actions/apply-step-1";

const initialState: ApplyStep1Response = {
  values: {
    firstName: "Test first name",
    middleName: "",
    surname: "",
  },
};

export const Step1Form: FC = () => {
  const [state, formAction, isPending] = useActionState(
    applyStep1,
    initialState,
  );

  return (
    <div>
      {state.success && <p className="text-green-400">Form submitted!!</p>}
      {state.errors && <p className="text-red-400">Please fix errors</p>}

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

        <SubmitButton disabled={isPending}>Submit</SubmitButton>
      </Form>
    </div>
  );
};
