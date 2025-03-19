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
  education_levels: string[];
  institutions: {
    id: string;
    name: string;
    path_alias: string;
  }[];
}

export const CourseFilter: FC<CourseFilterProps> = (
  options: CourseFilterProps,
) => {
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
    search: searchParams.get("search") ?? undefined,
    max_fee: Number(searchParams.get("max_fee")) ?? undefined,
    max_duration: Number(searchParams.get("duration")) ?? undefined,
    education_level: searchParams.getAll("education_level") ?? undefined,
    institution: searchParams.get("institution") ?? undefined,
  };

  console.log("initialValues", initialValues);

  const filterAction: FormAction<z.infer<typeof schema>> = async (
    _prev,
    formData,
  ) => {
    const values = getFormDataValues(formData, schema);
    const { error, success } = schema.safeParse(values);

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
    search: z.string(),
    max_fee: z.coerce.number().min(100).max(10000),
    max_duration: z.coerce.number().min(3).max(50),
    education_level: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
            ? v.split(",").filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),
    institution: z.union([z.string(), z.undefined()]),
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
            name="search"
            label="Search for courses"
            control={(props) => (
              <Input
                {...props}
                endDecorator={<IconSearch />}
                placeholder="Search for courses"
                onValueChange={(value) => {
                  handleFilterChange("search", value);
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
                name="max_fee"
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
                      handleFilterChange("max_fee", value.toString());
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <Field
                state={state}
                name="max_duration"
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
                      handleFilterChange("max_duration", value.toString());
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <Field
                state={state}
                name="education_level"
                label="Required previous education"
                control={(props) => (
                  <CheckboxGroup
                    orientation="horizontal"
                    size="sm"
                    {...props}
                    // options={options.education_levels.map((level) => ({
                    //   value: level,
                    //   label: level,
                    // }))}
                    onValueChange={(value) => {
                      console.log("value", value);
                      handleFilterChange("education_level", value);
                    }}
                  />
                )}
              />
            </div>
            <div className="grid gap-1">
              <div className="font-bold">Location</div>
              <Field
                state={state}
                name="institution"
                control={(props) => (
                  <Select
                    {...props}
                    placeholder="- Select location -"
                    options={options.institutions.map((institution) => ({
                      value: institution.id,
                      label: institution.name,
                    }))}
                    onValueChange={(value) =>
                      handleFilterChange("institution", value)
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
