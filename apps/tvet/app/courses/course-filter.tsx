"use client";

import { IconFilterDown, IconFilterUp, IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { CheckboxGroup } from "@workspace/ui/components/checkbox-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";
import { Field, Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select } from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";

import type { CoursesTableDataQueryParams } from "@/lib/api/courses";

const MINIMUM_FEE = 100;
const MAXIMUM_FEE = 10000;
const FEE_CURRENCY = "KES";
const MINIMUM_DURATION = 1;
const MAXIMUM_DURATION = 12;

type FilterKey = keyof CoursesTableDataQueryParams;

export interface CourseFilterProps {
  educationLevels?: {
    id: string;
    label: string;
  }[];
  institutions?: {
    id: string;
    name: string;
  }[];
}

export const CourseFilter: FC<CourseFilterProps> = ({
  educationLevels = [],
  institutions = [],
}) => {
  const t = useTranslations("CoursesPage");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultValues: CoursesTableDataQueryParams = {
    search: searchParams.get("search" satisfies FilterKey) ?? undefined,
    max_fee: searchParams.get("max_fee" satisfies FilterKey)
      ? Number(searchParams.get("max_fee" satisfies FilterKey))
      : undefined,
    max_duration: searchParams.get("max_duration" satisfies FilterKey)
      ? Number(searchParams.get("max_duration" satisfies FilterKey))
      : undefined,
    education_level:
      searchParams.getAll("education_level" satisfies FilterKey) ?? undefined,
    institution:
      searchParams.get("institution" satisfies FilterKey) ?? undefined,
  };

  const hasSelectedFilters = Object.values(defaultValues).some((value) =>
    Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== null && value !== "",
  );

  const [isOpen, setIsOpen] = useState(hasSelectedFilters);
  const [resetCount, setResetCount] = useState(0);

  const handleFilterChange = useDebouncedCallback(
    (name: FilterKey, value: string | string[]) => {
      const params = new URLSearchParams(searchParams);
      if (params.has(name) && value === params.get(name)) {
        return;
      }

      params.delete(name);

      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(name, v);
        });
      } else {
        params.set(name, value);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    300,
  );

  return (
    <Container key={resetCount}>
      <Form onSubmit={(e) => e.preventDefault()}>
        <Field
          name="search"
          label={t("search")}
          control={(props) => (
            <Input
              {...props}
              endDecorator={<IconSearch />}
              placeholder={t("search")}
              defaultValue={defaultValues.search}
              onValueChange={(value) => {
                handleFilterChange("search", value);
              }}
            />
          )}
        />

        <Collapsible
          title={t("filterTitle")}
          className="mt-4"
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <CollapsibleContent
            className="space-y-4 data-[state=closed]:hidden"
            forceMount
          >
            <div className="flex items-center justify-between">
              <h2 className="typo-h5">{t("filterTitle")}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.replace(`${pathname}`);

                  // TODO: Fix this once we have controlled fields
                  window.setTimeout(() => {
                    setResetCount((prev) => prev + 1);
                  }, 300);
                }}
              >
                {t("reset")}
              </Button>
            </div>

            <Field
              name="max_fee"
              label={t("maxFee")}
              control={(props) => (
                <Slider
                  {...props}
                  defaultValue={defaultValues.max_fee}
                  min={MINIMUM_FEE}
                  max={MAXIMUM_FEE}
                  step={100}
                  startDecorator={
                    <Currency
                      amount={0}
                      currency={FEE_CURRENCY}
                      minimumFractionDigits={0}
                    />
                  }
                  endDecorator={
                    <Currency
                      amount={MAXIMUM_FEE}
                      currency={FEE_CURRENCY}
                      minimumFractionDigits={0}
                    />
                  }
                  onValueChange={(value) => {
                    handleFilterChange("max_fee", value.toString());
                  }}
                />
              )}
            />

            <Field
              name="max_duration"
              label={t("duration")}
              control={(props) => (
                <Slider
                  {...props}
                  defaultValue={defaultValues.max_duration}
                  min={MINIMUM_DURATION}
                  max={MAXIMUM_DURATION}
                  startDecorator={t("months", { month: MINIMUM_DURATION })}
                  endDecorator={t("months", { month: MAXIMUM_DURATION })}
                  onValueChange={(value) => {
                    handleFilterChange("max_duration", value.toString());
                  }}
                />
              )}
            />

            {educationLevels.length > 0 && (
              <Field
                name="education_level"
                label={t("educationLevel")}
                control={(props) => (
                  <CheckboxGroup
                    orientation="horizontal"
                    size="sm"
                    {...props}
                    defaultValue={defaultValues.education_level}
                    options={educationLevels.map((level) => ({
                      label: level.label,
                      value: level.id,
                    }))}
                    onValueChange={(value) => {
                      handleFilterChange("education_level", value);
                    }}
                  />
                )}
              />
            )}

            {institutions.length > 0 && (
              <Field
                name="institution"
                label={t("location")}
                control={(props) => (
                  <Select
                    {...props}
                    defaultValue={defaultValues.institution}
                    placeholder={t("locationPlaceholder")}
                    options={institutions.map((institution) => ({
                      value: institution.id,
                      label: institution.name,
                    }))}
                    onValueChange={(value) =>
                      handleFilterChange("institution", value)
                    }
                  />
                )}
              />
            )}
            {/* {tags.length > 0 && (
              <Field
                name="tags"
                label={t("trainingAreas")}
                control={(props) => (
                  <Select
                    {...props}
                    defaultValue={defaultValues.tags}
                    placeholder={t("trainingAreas")}
                    options={tags.map((tag) => ({
                      value: tag.id,
                      label: tag.name,
                    }))}
                    onValueChange={(value) =>
                      handleFilterChange("tags", value)
                    }
                  />
                )}
              />
            )} */}
          </CollapsibleContent>

          <CollapsibleTrigger asChild className="flex w-full">
            <button className="flex cursor-pointer justify-center gap-1 p-4">
              {isOpen ? (
                <>
                  <IconFilterUp /> {t("closeFilter")}
                </>
              ) : (
                <>
                  <IconFilterDown /> {t("openFilter")}
                </>
              )}
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      </Form>
    </Container>
  );
};
