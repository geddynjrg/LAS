import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { TrainingAreaCard } from "@workspace/ui/components/tvet/training-area-card";

import { Heading } from "@/components/heading";
import type { TrainingAreasBlockType } from "@/lib/api/schema/block/training-areas-block.schema";

export interface TrainingAreasBlockProps extends TrainingAreasBlockType {}

export const TrainingAreasBlock: FC<TrainingAreasBlockProps> = ({ areas }) => {
  const t = useTranslations("TrainingAreaBlock");

  return (
    <Container className="mt-4 py-12">
      <Heading type="h2">{t("title")}</Heading>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <Link key={area.id} href={`courses?tags=${area.id}`}>
            <TrainingAreaCard title={area.name}>
              {t("coursesAvailable", { count: area.course_count })}
            </TrainingAreaCard>
          </Link>
        ))}
      </div>
    </Container>
  );
};
