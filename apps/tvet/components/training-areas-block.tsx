import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { TrainingAreaCard } from "@workspace/ui/components/tvet/training-area-card";

import { Heading } from "@/components/heading";
import type { TrainingAreasBlockType } from "@/lib/api/types";

export interface TrainingAreasBlockProps extends TrainingAreasBlockType {}

export const TrainingAreasBlock: FC<TrainingAreasBlockProps> = ({ areas }) => {
  return (
    <Container className="mt-4 py-12">
      <Heading type="h2">Training areas</Heading>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <Link href="#">
            <TrainingAreaCard title={area.name}>
              {area.course_count} courses available
            </TrainingAreaCard>
          </Link>
        ))}
      </div>
    </Container>
  );
};
