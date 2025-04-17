import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";

import { getCourseNodeById } from "@/lib/api/node";

export interface ApplyFormTitleProps {
  courseId?: string;
}

export const ApplyFormTitle: FC<ApplyFormTitleProps> = async ({ courseId }) => {
  const t = await getTranslations("ApplicantForm");

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
