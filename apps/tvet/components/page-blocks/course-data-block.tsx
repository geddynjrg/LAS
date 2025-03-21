import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Currency } from "@workspace/ui/components/currency";

import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { CourseDataBlockType } from "@/lib/api/schema/block/course-data-block.schema";

export interface CourseDataBlockProps extends CourseDataBlockType {}

export const CourseDataBlock: FC<CourseDataBlockProps> = ({
  description,
  course_fee,
  application_fee,
  test_booking_fee,
  group_size,
  minimum_entry_requirements,
  training_format,
  equipment_available_at_ins,
}) => {
  const t = useTranslations("CourseDataBlock");

  return (
    <section>
      <div className="bg-neutral-100 pb-6 pt-8">
        {description && (
          <Container>
            <DescriptionBlock {...description} className="px-4" />
          </Container>
        )}
      </div>
      <div className="app-container bg-neutral-200 px-4">
        <div className="bg-primary [&>div]:mt-0.25 [&>div]:last:mb-0.25 grid grid-cols-1 text-center">
          {/* <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("duration")}</p>
            <p>1-2 years</p>
          </div> */}
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("fees")}</p>
            <p>
              <span className="font-bold">{t("courseFee")}: </span>
              <Currency amount={course_fee} currency="KES" />
            </p>
            <p>
              <span className="font-bold">{t("applicationFee")}: </span>
              <Currency amount={application_fee} currency="KES" />
            </p>
            <p>
              <span className="font-bold">{t("applicationFee")}: </span>
              <Currency amount={test_booking_fee} currency="KES" />
            </p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("trainingFormat")}</p>
            <DescriptionBlock {...training_format} />
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("groupSize")}</p>
            <p>{group_size}</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("minimumEntryRequirements")}</p>
            <DescriptionBlock {...minimum_entry_requirements} />
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">{t("equipmentAvailableAtInstitution")}</p>
            <DescriptionBlock {...equipment_available_at_ins} />
          </div>
        </div>
      </div>
      <section className="bg-neutral-100 pb-12 pt-8">
        <div className="app-container px-4">
          <div className="flex items-center px-4">
            <Button className="md:max-w-3xs mx-auto mt-4 w-full" asChild>
              <Link href="/login/phone?callbackUrl=/apply">
                {t("applyNow")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </section>
  );
};
