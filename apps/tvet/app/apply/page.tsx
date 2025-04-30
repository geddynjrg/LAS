import { getTranslations } from "next-intl/server";
import Form from "next/form";
import { redirect } from "next/navigation";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

import { ApplyForm } from "@/app/apply/apply-form";
import { createApplication } from "@/lib/api/application";

export interface ApplyPageProps {
  searchParams: Promise<{ course?: string }>;
}

const applyAction = async (formData: FormData) => {
  "use server";
  const course_id = formData.get("course_id")?.toString();

  const course = await createApplication({
    course_id: course_id ? Number(course_id) : undefined,
  });

  if (course.error) {
    console.warn("createApplication error", course.error);
    throw new Error(course.error.message);
  }

  throw redirect(`/apply/${course.data?.application_id}/applicant`);
};

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const { course } = await searchParams;

  const t = await getTranslations("ApplyPage");
  return (
    <div className="flex flex-1 flex-col">
      <Container className="max-w-[500px] flex-1">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="mt-4">{t("description")}</p>
        <NumberedList
          variant="bulletNumbers"
          bulletAlignment="top"
          className="mx-auto mt-8"
        >
          <NumberedListItem>
            <p className="typo-h6">{t("1Heading")}</p>
            <p className="mt-2">{t("1Description")}</p>
          </NumberedListItem>
          <NumberedListItem>
            <p className="typo-h6">{t("2Heading")}</p>
            <p className="mt-2">{t("2Description")}</p>
          </NumberedListItem>
          <NumberedListItem>
            <p className="typo-h6">{t("3Heading")}</p>
            <p className="mt-2">{t("3Description")}</p>
          </NumberedListItem>
        </NumberedList>
      </Container>

      <ActionBar>
        <Form action={applyAction} className="flex flex-1 items-center">
          <ApplyForm course={course} />
        </Form>
      </ActionBar>
    </div>
  );
}
