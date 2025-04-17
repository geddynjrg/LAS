import type { Meta, StoryObj } from "@storybook/react";

import { HighlightedCourseListingBlock } from "@workspace/ui/components/tvet/blocks/highlighted-course-listing-block";

const meta = {
  component: HighlightedCourseListingBlock,
  args: {
    block_type: "highlighted_course_listing",
    courses: [
      {
        id: "1",
        title: "Course 1",
        tags: ["tag1", "tag2"],
        application_fee: 100,
        course_fee: 200,
        apply_till: ["2023-12-31"],
        start_on: ["2024-01-01"],
        institution: {
          id: "inst1",
          type: "type1",
          uuid: "uuid1",
          title: "Institution 1",
          path_alias: "/institution-1",
        },
        url: "/course-1",
        path_alias: "/course-1",
      },
      {
        id: "2",
        title: "Course 2",
        tags: ["tag3", "tag4"],
        application_fee: null,
        course_fee: 300,
        apply_till: ["2024-01-15"],
        start_on: ["2024-02-01"],
        institution: {
          id: "inst2",
          type: "type2",
          uuid: "uuid2",
          title: "Institution 2",
          path_alias: "/institution-2",
        },
        url: "/course-2",
        path_alias: "/course-2",
      },
    ],
  },
} satisfies Meta<typeof HighlightedCourseListingBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
