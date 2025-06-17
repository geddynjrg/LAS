"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export interface CoursesTableDataQueryParams {
  search?: string;
  min_fee?: number;
  max_fee?: number;
  min_duration?: number;
  max_duration?: number;
  education_level?: string | string[];
  institution?: string;
  page?: number;
  limit?: number;
  sort?: "title" | "created" | "changed" | "fee" | "duration";
  tags?: string[];
  direction?: "asc" | "desc";
}

export async function getCoursesList(params: CoursesTableDataQueryParams) {
  const res = await api.GET("/api/v1/courses", {
    params: {
      header: {
        "X-Language": await getLocale(),
      },
      query: {
        search: params.search,
        min_fee: params.min_fee,
        max_fee: params.max_fee,
        min_duration: params.min_duration,
        max_duration: params.max_duration,
        education_level: params.education_level,
        institution: params.institution,
        page: params.page,
        limit: params.limit,
        sort: params.sort,
        direction: params.direction,
        tags: params.tags,
      },
    },
  });

  return validate(res, schema);
}

const courseSchema = z.object({
  id: z.string(),
  type: z.string(),
  uuid: z.string(),
  title: z.string(),
  language: z.object({
    code: z.string(),
    name: z.string(),
    direction: z.string(),
  }),
  url: z.string(),
  path_alias: z.string(),
  content: z.object({
    application_fee: z.number(),
    apply_till: z.array(z.string()),
    test_booking_fee: z.number(),
    course_fee: z.number(),
    duration: z.number(),
    education_level: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
        }),
      )
      .optional(),
    group_size: z.number(),
    tags: z.array(z.string()).optional(),
    intake_period: z.array(z.string()),
    institution: z.object({
      id: z.string(),
      type: z.string(),
      uuid: z.string(),
      title: z.string(),
      path_alias: z.string(),
    }),
  }),
});

const schema = z.object({
  data: z
    .object({
      courses: z.array(courseSchema),
    })
    .optional(),
  meta: z
    .object({
      pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        pages: z.number(),
      }),
      filters: z.object({
        search: z.string().nullable(),
        min_fee: z.number().nullable(),
        max_fee: z.number().nullable(),
        min_duration: z.number().nullable(),
        max_duration: z.number().nullable(),
        education_level: z.string().nullable(),
        institution: z.string().nullable(),
      }),
      sort: z.object({
        field: z.string(),
        direction: z.string(),
      }),
      filter_options: z.object({
        education_levels: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
          }),
        ),
        institutions: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            path_alias: z.string(),
          }),
        ),
        tags: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            weight: z.number(),
          }),
        ),
      }),
    })
    .optional(),
});

export type CourseType = z.infer<typeof courseSchema>;
