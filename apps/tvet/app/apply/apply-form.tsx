"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@workspace/ui/components/button";

export const ApplyForm: FC<{
  course?: string;
}> = ({ course }) => {
  const { pending } = useFormStatus();

  const t = useTranslations("ApplyPage");

  return (
    <>
      <input type="hidden" name="course_id" value={course} />
      <Button className="px-22 mx-auto" type="submit" disabled={pending}>
        {t("understood")}
      </Button>
    </>
  );
};
