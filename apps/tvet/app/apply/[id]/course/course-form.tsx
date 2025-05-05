"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FC } from "react";

import { Combobox } from "@workspace/ui/components/combobox";
import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field } from "@workspace/ui/components/form";
import { Select } from "@workspace/ui/components/select";
import { useDebouncedCallback } from "@workspace/ui/hooks/use-debounce";
import { useForm } from "@workspace/ui/hooks/use-form";
import { useMount } from "@workspace/ui/hooks/use-mount";
import type { DeepPartial } from "@workspace/ui/types";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { courseAction } from "@/app/apply/[id]/course/course-action";
import {
  courseSchema,
  dummyIntakePeriods,
  FILE_ACCEPT,
  MAX_FILE_SIZE,
  type CourseSchema,
} from "@/app/apply/[id]/course/course-schema";
import { getCoursesList } from "@/lib/api/courses";

export interface CourseFormProps {
  id: string;
  prevStep?: string;
  institutions?: { id: string | number; title: string }[];
  defaultValues?: DeepPartial<CourseSchema>;
}

export const CourseForm: FC<CourseFormProps> = ({
  id,
  institutions,
  defaultValues,
  prevStep,
}) => {
  const t = useTranslations("ApplyForm");
  const [state, formAction, isPending] = useForm(
    courseAction,
    courseSchema,
    defaultValues,
  );

  const [selectedInstitute, setSelectedInstitute] = useState(
    state.values?.institution,
  );

  const [courses, searchCourses, isSearchingCourses] = useSearchCourses();
  const [selectedCourse, setSelectedCourse] = useState(state.values?.course);

  const intakePeriods =
    courses.find((course) => course.value === selectedCourse)?.intakePeriods ??
    [];

  useMount(() => {
    if (selectedInstitute) {
      searchCourses(selectedInstitute);
    }
  });

  function handleInstitutionChange(value: string) {
    setSelectedInstitute(value);
    setSelectedCourse(undefined);

    searchCourses(value, undefined);
  }

  return (
    <ApplyFormWrap
      action={formAction}
      isPending={isPending}
      prevUrl={prevStep}
      className="space-y-4"
    >
      <ApplyFormSubtitle>{t("courseTitle")}</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="institution"
        label={t("chooseInstitution")}
        required
        control={(props) => (
          <Combobox
            options={institutions?.map((institution) => ({
              label: institution.title,
              value: institution.id.toString(),
            }))}
            onValueChange={handleInstitutionChange}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="course"
        label={t("chooseCourse")}
        required
        control={(props) => (
          <Combobox
            loading={isSearchingCourses}
            disabled={courses.length === 0}
            options={courses}
            onValueChange={setSelectedCourse}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="preferred_intake_period"
        label={t("preferredIntakePeriod")}
        required
        control={(props) => (
          <Select
            options={intakePeriods}
            disabled={intakePeriods.length === 0}
            {...props}
          />
        )}
      />

      <ApplyFormSubtitle className="mt-8">
        {t("requiredDocuments")}
      </ApplyFormSubtitle>

      <Field
        state={state}
        name="highest_education_certificate"
        label={t("highestEducationCertificate")}
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_ACCEPT}
            maxSize={MAX_FILE_SIZE}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="other_certificate"
        label={t("otherCertificates")}
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_ACCEPT}
            maxSize={MAX_FILE_SIZE}
            {...props}
          />
        )}
      />
    </ApplyFormWrap>
  );
};

function useSearchCourses() {
  const [isPending, startTransition] = useTransition();

  const [courses, setCourses] = useState<
    {
      label: string;
      value: string;
      intakePeriods: { label: string; value: string }[];
    }[]
  >([]);

  const searchCourses = useDebouncedCallback(
    (institution: string, search?: string) => {
      startTransition(async () => {
        const res = await getCoursesList({ institution, search });

        setCourses(
          res?.data?.courses?.map((course) => ({
            label: course.title,
            value: course.id.toString(),
            intakePeriods: dummyIntakePeriods,
          })) ?? [],
        );
      });
    },
  );

  return [courses, searchCourses, isPending] as const;
}
