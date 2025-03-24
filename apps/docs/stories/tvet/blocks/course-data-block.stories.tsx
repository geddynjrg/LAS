import type { Meta, StoryObj } from "@storybook/react";

import { CourseDataBlock } from "@workspace/ui/components/tvet/blocks/course-data-block";

const meta = {
  component: CourseDataBlock,
  args: {
    block_type: "course_data",
    description: {
      value:
        "<p>The course is based on primary and secondary leaver’s students who are willingly and ready to acquire electrical knowledge and skills.</p>",
      format: "full_html",
      processed:
        "<p>The course is based on primary and secondary leaver’s students who are willingly and ready to acquire electrical knowledge and skills.</p>",
    },
    course_fee: 1000,
    application_fee: 250,
    equipment_available_at_ins: {
      value: "Course Description",
      format: "full_html",
      processed: "Course Description",
    },
    group_size: 10,
    minimum_entry_requirements: {
      value: "KCPE Certificate or Equivalent qualification approved by KNEC",
      format: "full_html",
      processed:
        "KCPE Certificate or Equivalent qualification approved by KNEC",
    },
    test_booking_fee: 100,
    training_format: {
      value: "Course Description",
      format: "full_html",
      processed: "Course Description",
    },
  },
} satisfies Meta<typeof CourseDataBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
