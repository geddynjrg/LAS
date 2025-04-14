"use server";

import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

/**
 * Get courses table data
 * @returns {Promise<z.infer<typeof schema>>}
 *
 * * @param {CoursesTableDataQuery} params
 * @typedef CoursesTableDataQuery
 * @property {string} [search] Search in title and body
 * @property {number} [min_fee] Minimum course fee (KSh)
 * @property {number} [max_fee] Maximum course fee (KSh)
 * @property {number} [min_duration] Minimum duration in months
 * @property {number} [max_duration] Maximum duration in months
 * @property {string} [education_level] Required education level (none, KCSE, Education 3, Education 4)
 * @property {number} [institution] Institution ID to filter by
 * @property {number} [page] Page number (0-based, default: 0)
 * @property {number} [limit] Items per page (1-50, default: 12)
 * @property {string} [sort] Sort field (created, title)
 * @property {string} [direction] Sort direction (ASC, DESC)
 *
 * @returns {Promise<z.infer<typeof schema>>}
 * @example
 * {
 *    "total": 200,
 *    "page": 0,
 *    "limit": 12,
 *    "pages": 17,
 *    "courses": [
 *       {
 *          "id": 123,
 *          "title": "Course Title",
 *          "tags": [
 *             {
 *                "id": 1,
 *                "name": "Tag Name"
 *             }
 *          ],
 *          "application_fee": "1000",
 *          "course_fee": "5000",
 *          "apply_till": "2024-12-31",
 *          "start_on": "2024-01-01",
 *          "institution": {
 *             "id": 456,
 *             "title": "Institution Name",
 *             "url": "/institution/name"
 *          },
 *          "duration": "6",
 *          "education_level": "none",
 *          "url": "/node/123",
 *          "path_alias": "/course/course-title"
 *       }
 *    ]
 * }
 */

export interface CoursesTableDataQueryParams {
  search?: string;
  min_fee?: number;
  max_fee?: number;
  min_duration?: number;
  max_duration?: number;
  education_level?: string[];
  institution?: string;
  page?: number;
  limit?: number;
  sort?: "title" | "created" | "changed" | "fee" | "duration";
  tags?: string[];
  direction?: "asc" | "desc";
}

export async function getCoursesTableData(params: CoursesTableDataQueryParams) {
  const res = await api.GET("/api/v1/courses", {
    params: {
      query: {
        _format: "json",
        search: params.search,
        min_fee: params.min_fee,
        max_fee: params.max_fee,
        min_duration: params.min_duration,
        max_duration: params.max_duration,
        // @ts-expect-error - its an API issue (expects comma separated values)
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
    education_level: z.array(z.string()),
    group_size: z.number(),
    tags: z.array(z.string()).optional(),
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
        institution: z.number().nullable(),
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
