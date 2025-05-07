import Form from "next/form";
import { redirect } from "next/navigation";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

import { ApplyForm } from "@/app/apply/apply-form";
import { createApplication, getIntroContent } from "@/lib/api/application";

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
  const data = await getIntroContent();

  return (
    <div className="flex flex-1 flex-col">
      <Container className="max-w-[500px] flex-1">
        {data?.title && <h2 className="typo-h2">{data.title}</h2>}
        {data?.subtitle && <p className="mt-4">{data.subtitle}</p>}

        {data?.blocks && (
          <NumberedList
            variant="bulletNumbers"
            bulletAlignment="top"
            className="mx-auto mt-8"
          >
            {data.blocks.map((block) => (
              <NumberedListItem key={block.id}>
                <p className="typo-h6">{block.title}</p>
                <p className="mt-2">{block.description}</p>
              </NumberedListItem>
            ))}
          </NumberedList>
        )}
      </Container>

      <ActionBar>
        <Form action={applyAction} className="flex flex-1 items-center">
          <ApplyForm course={course} />
        </Form>
      </ActionBar>
    </div>
  );
}
