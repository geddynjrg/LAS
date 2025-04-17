import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ActionBar } from "@workspace/ui/components/action-bar";
import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import {
  NumberedList,
  NumberedListItem,
} from "@workspace/ui/components/numbered-list";

export interface ApplyPageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const { course } = await searchParams;

  const nextPageLink = course
    ? `/apply/new/applicant?course=${course}`
    : "/apply/new/applicant";

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
        <Button className="px-22 mx-auto" asChild>
          <Link href={nextPageLink}>{t("understood")}</Link>
        </Button>
      </ActionBar>
    </div>
  );
}
