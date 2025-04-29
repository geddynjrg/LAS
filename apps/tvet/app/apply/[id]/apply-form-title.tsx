import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";

import { getCourseNodeById } from "@/lib/api/node";

export interface ApplyFormTitleProps {
  application?: {
    steps_data?: {
      course?: {
        course?: string;
      };
    };
  };
  courseId?: string;
}

export const ApplyFormTitle: FC<ApplyFormTitleProps> = async ({
  application,
}) => {
  const t = await getTranslations("ApplicantForm");

  const courseId = application?.steps_data?.course?.course;

  const courseNode = courseId
    ? (await getCourseNodeById(courseId))?.data
    : null;

  const title = courseNode?.title || t("title");
  const label = courseNode?.content?.institution?.title || undefined;

  return (
    <Container>
      {label && <p>{label}</p>}
      <h2 className="typo-h2">{title}</h2>
    </Container>
  );
};
