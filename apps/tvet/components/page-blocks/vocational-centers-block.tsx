import { IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Container } from "@workspace/ui/components/container";
import { Underline } from "@workspace/ui/components/underline";

import { Heading } from "@/components/heading";
import { LocationMap } from "@/components/location-map";
import type { VocationalCentresBlockType } from "@/lib/api/schema/block/vocational-centres-block.schema";

export interface VocationalCentersBlockProps
  extends VocationalCentresBlockType {}

export const VocationalCentersBlock: FC<VocationalCentersBlockProps> = ({
  institutions,
}) => {
  const t = useTranslations("VocationalCentersBlock");
  // split institutions by address locality (town?)
  const locations = institutions.reduce(
    (acc: { [key: string]: typeof institutions }, institution) => {
      const locality = institution.address.locality;
      if (acc[locality]) {
        acc[locality].push(institution);
      } else {
        acc[locality] = [institution];
      }
      return acc;
    },
    {},
  );

  return (
    <Container className="flex flex-col gap-4 px-0 lg:flex-row-reverse">
      <section className="mt-4 px-4 py-12 lg:shrink">
        <Heading type="h2" className="typo-h2">
          {t("nairobiVocationalCenters")}
        </Heading>

        <div className="mt-8 grid auto-cols-max gap-4">
          {Object.entries(locations).map(([locality, institutions]) => (
            <div className="grid gap-1" key={locality}>
              <p className="typo-h5">{locality}</p>
              {institutions.map((institution) => (
                <Underline asChild key={institution.id}>
                  <Link href={institution.path_alias}>
                    {institution.title}
                    <IconArrowRight />
                  </Link>
                </Underline>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="map relative box-border min-h-[550px] w-full md:my-8 md:pl-4">
        <LocationMap institutes={institutions} />
      </section>
    </Container>
  );
};
