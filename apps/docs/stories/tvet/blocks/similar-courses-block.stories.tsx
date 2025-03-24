import type { Meta, StoryObj } from "@storybook/react";

import { SimilarCoursesBlock } from "@workspace/ui/components/tvet/blocks/similar-courses-block";

const meta = {
  component: SimilarCoursesBlock,
  args: {
    block_type: "similar_courses",
    courses: [
      {
        title: "Course Title",
        apply_till: ["2022-12-31"],
        application_fee: 250,
        course_fee: 10000,
        id: "1",
        institution: {
          id: "1",
          type: "institution",
          path_alias: "institution-name",
          title: "Institution Name",
          uuid: "1",
        },
        path_alias: "course-name",
        start_on: ["2022-01-01"],
        tags: ["tag1", "tag2"],
        url: "https://example.com",
      },
    ],
  },
} satisfies Meta<typeof SimilarCoursesBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
