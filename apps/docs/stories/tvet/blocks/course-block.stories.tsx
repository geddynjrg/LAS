import type { Meta, StoryObj } from "@storybook/react";

import { CoursesBlock } from "@workspace/ui/components/tvet/blocks/courses-block";

const meta = {
  component: CoursesBlock,
  args: {
    block_type: "courses",
    title: "Courses",
    short_description: {
      value: "Short Description",
      format: "full_html",
      processed: "Short Description",
    },
    courses: [
      {
        title: "Course Title",
        tags: ["tag1", "tag2"],
        id: "course-id",
        url: "https://course-url.com",
        path_alias: "course-path",
        application_fee: 250,
        course_fee: 1000,
        apply_till: ["2022-01-01"],
        start_on: ["2022-01-01"],
        institution: {
          title: "Institution Title",
          type: "institution",
          id: "institution-id",
          uuid: "institution-uuid",
          path_alias: "",
        },
      },
      {
        title: "Course Title 2",
        tags: ["tag1", "tag2"],
        id: "course-id",
        url: "https://course-url.com",
        path_alias: "course-path",
        application_fee: 250,
        course_fee: 1000,
        apply_till: ["2022-01-01"],
        start_on: ["2022-01-01"],
        institution: {
          title: "Institution Title",
          type: "institution",
          id: "institution-id",
          uuid: "institution-uuid",
          path_alias: "",
        },
      },
    ],
  },
} satisfies Meta<typeof CoursesBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
