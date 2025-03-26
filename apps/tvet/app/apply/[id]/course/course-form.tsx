"use client";

import { useState, type FC } from "react";

import { FileUploadInput } from "@workspace/ui/components/file-upload-input";
import { Field } from "@workspace/ui/components/form";
import { Select } from "@workspace/ui/components/select";
import { useForm } from "@workspace/ui/hooks/use-form";

import { ApplyFormSubtitle } from "@/app/apply/[id]/apply-form-subtitle";
import { ApplyFormWrap } from "@/app/apply/[id]/apply-form-wrap";
import { courseAction } from "@/app/apply/[id]/course/course-action";
import {
  courseSchema,
  dummyInstitutes,
  FILE_TYPE,
  MAX_FILE_SIZE,
  type CourseSchema,
} from "@/app/apply/[id]/course/course-schema";

export interface CourseFormProps {
  id: string;
  defaultValues?: Partial<CourseSchema>;
}

export const CourseForm: FC<CourseFormProps> = ({ id, defaultValues }) => {
  const [state, formAction, isPending] = useForm(
    courseAction,
    courseSchema,
    defaultValues,
  );

  const [selectedInstitute, setSelectedInstitute] = useState(
    state.values?.institute,
  );

  const [selectedCourse, setSelectedCourse] = useState(state.values?.course);

  const courses = dummyInstitutes.find(
    (institute) => institute.value === selectedInstitute,
  )?.courses;

  const intakePeriods = courses?.find(
    (course) => course.value === selectedCourse,
  )?.intakePeriods;

  return (
    <ApplyFormWrap action={formAction} prevUrl="guardian" className="space-y-4">
      <ApplyFormSubtitle>Course</ApplyFormSubtitle>
      <input type="hidden" name="id" value={id} />

      <Field
        state={state}
        name="institute"
        label="Choose the institution"
        required
        control={(props) => (
          <Select
            options={dummyInstitutes}
            onValueChange={setSelectedInstitute}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="course"
        label="Choose the course"
        required
        control={(props) => (
          <Select
            options={courses}
            onValueChange={setSelectedCourse}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="intakePeriod"
        label="Preferred intake period"
        required
        control={(props) => <Select options={intakePeriods} {...props} />}
      />

      <ApplyFormSubtitle className="mt-8">Required documents</ApplyFormSubtitle>

      <Field
        state={state}
        name="highestQualificationCertificate"
        label="Highest education level certificate"
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_TYPE}
            maxSize={MAX_FILE_SIZE}
            {...props}
          />
        )}
      />

      <Field
        state={state}
        name="otherCertificate"
        label="Other certificate"
        required
        control={(props) => (
          <FileUploadInput
            accept={FILE_TYPE}
            maxSize={MAX_FILE_SIZE}
            {...props}
          />
        )}
      />
    </ApplyFormWrap>
  );
};
