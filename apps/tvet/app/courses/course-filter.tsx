"use client";

import { IconFilterDown, IconFilterUp, IconSearch } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FC, type ReactNode } from "react";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Container } from "@workspace/ui/components/container";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select } from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

export interface CourseFilterProps {
  children?: ReactNode;
}

export const CourseFilter: FC<CourseFilterProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleFilterChange = useDebounce(
    (name: string, value: string | string[]) => {
      const params = new URLSearchParams(searchParams);
      params.delete(Array.isArray(value) ? `${name}[]` : name);

      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(`${name}[]`, v);
        });
      } else {
        params.set(name, value);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    1000,
  );

  // add search-param values to form state
  const initialValues = {
    qs: searchParams.get("qs") ?? undefined,
    maxFee: Number(searchParams.get("maxFee")) ?? undefined,
    duration: Number(searchParams.get("duration")) ?? undefined,
    education: searchParams.getAll("education") ?? undefined,
    location: searchParams.get("location") ?? undefined,
  };

  console.log("initialValues", initialValues);

  const filterAction: FormAction<z.infer<typeof schema>> = async (
    _prev,
    formData,
  ) => {
    const values = getFormDataValues(formData, schema);
    const { error, data, success } = schema.safeParse(values);

    if (!success) {
      return {
        success,
        errors: error.flatten().fieldErrors,
        values,
      };
    }

    return { success, test: 123 };
  };

  const schema = z.object({
    qs: z.string(),
    maxFee: z.coerce.number().min(100).max(10000),
    duration: z.coerce.number().min(3).max(50),
    education: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
            ? v.split(",").filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),
    location: z.union([z.string(), z.undefined()]),
  });

  const [state, _action, _isPending] = useForm(
    filterAction,
    schema,
    initialValues,
  );

  return (
    <Container>
      <Form onSubmit={(e) => e.preventDefault()}>
        <div>
          <Field
            state={state}
            name="qs"
            label="Search for courses"
            control={(props) => (
              <Input
                {...props}
                endDecorator={<IconSearch />}
                placeholder="Search for courses"
                onValueChange={(value) => {
                  handleFilterChange("qs", value);
                }}
              />
            )}
          />
        </div>
        <Collapsible
          title="Filter by institution"
          className="mt-4"
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <CollapsibleContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="typo-h5">Filter courses</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(`${pathname}`);
                  router.refresh();
                }}
              >
                Reset
              </Button>
            </div>
            <div className="grid gap-1">
              <Field
                state={state}
                name="maxFee"
                label="Maximum fee"
                control={(props) => (
                  <Slider
                    {...props}
                    min={100}
                    max={10000}
                    startDecorator="100 KSh"
                    endDecorator="10000 KSh"
                    thumbLabel={(value) => `${value} KSh`}
                    onValueChange={(value) => {
                      handleFilterChange("maxFee", value.toString());
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <Field
                state={state}
                name="duration"
                label="Duration"
                control={(props) => (
                  <Slider
                    {...props}
                    min={1}
                    max={12}
                    startDecorator="1 month"
                    endDecorator="12 months"
                    thumbLabel={(value) => `${value} months`}
                    onValueChange={(value) => {
                      handleFilterChange("duration", value.toString());
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <Field
                state={state}
                name="education"
                label="Required previous education"
                control={(props) => (
                  <CheckboxGroup
                    orientation="horizontal"
                    size="sm"
                    {...props}
                    options={[
                      {
                        value: "none",
                        label: "None",
                      },
                      {
                        value: "ksce",
                        label: "KSCE",
                      },
                      {
                        value: "education3",
                        label: "Education 3",
                      },
                      {
                        value: "education4",
                        label: "Education 4",
                      },
                    ]}
                    onValueChange={(value) => {
                      console.log("value", value);
                      handleFilterChange("education", value);
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <div className="font-bold">Location</div>
              <Field
                state={state}
                name="location"
                control={(props) => (
                  <Select
                    {...props}
                    placeholder="- Select location -"
                    options={[
                      {
                        value: "waithaka",
                        label: "Waithaka VTC",
                      },
                      {
                        value: "oldmatahari",
                        label: "Old Mathari VTC",
                      },
                    ]}
                    onValueChange={(value) =>
                      handleFilterChange("location", value)
                    }
                  />
                )}
              />
            </div>
          </CollapsibleContent>
          <CollapsibleTrigger asChild className="flex w-full">
            {isOpen ? (
              <button className="flex justify-center gap-1 p-4">
                {<IconFilterUp />} Close filter
              </button>
            ) : (
              <button className="flex justify-center gap-1 p-4">
                {<IconFilterDown />} Open filter
              </button>
            )}
          </CollapsibleTrigger>
        </Collapsible>
      </Form>
    </Container>
  );
};
