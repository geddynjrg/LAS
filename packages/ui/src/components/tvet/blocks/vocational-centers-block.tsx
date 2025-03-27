import { IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

import { Container } from "@workspace/ui/components/container";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { LocationMap } from "@workspace/ui/components/tvet/location-map";
import { Underline } from "@workspace/ui/components/underline";
import { cn } from "@workspace/ui/lib/utils";

export interface VocationalCentersBlockProps {
  block_type: "vocational_centres";

  institutions: {
    id: string;
    title: string;
    address: {
      country_code?: string | null;
      administrative_area?: string | null;
      locality?: string | null;
      dependent_locality?: string | null;
      postal_code?: string | null;
      address_line?: string | null;
      organization?: string | null;
    };
    location: {
      latitude: number;
      longitude: number;
    };
    url: string;
    path_alias: string;
  }[];
}

export const VocationalCentersBlock: FC<VocationalCentersBlockProps> = ({
  institutions,
}) => {
  const t = useTranslations("VocationalCentersBlock");
  // split institutions by address locality (town?)
  const locations = institutions.reduce(
    (acc: { [key: string]: typeof institutions }, institution) => {
      const locality = institution.address.locality;
      if (locality === null) {
        acc[""]?.push(institution);
      } else if (acc[locality!]) {
        acc[locality!]?.push(institution);
      } else {
        acc[locality!] = [institution];
      }
      return acc;
    },
    {},
  );

  return (
    <Container className={cn("flex flex-col gap-4 px-0 lg:flex-row-reverse")}>
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
