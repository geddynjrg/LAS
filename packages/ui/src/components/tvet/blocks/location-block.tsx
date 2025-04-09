import { IconArrowGuide } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Heading } from "@workspace/ui/components/tvet/heading";
import { LocationMap } from "@workspace/ui/components/tvet/location-map";

export interface LocationBlockProps {
  block_type: "location";
  location: {
    latitude: number;
    longitude: number;
  };
  address: {
    country_code: string;
    administrative_area: string | null;
    locality: string | null;
    dependent_locality: string | null;
    postal_code: string | null;
    address_line: string | null;
    organization: string | null;
  };
  hint: string;
  image: {
    title: string;
    type: string;
    id: string;
    uuid: string;
    name: string;
    url: string;
    bundle: string;
    mime_type: string;
    size: number;
    alt: string;
    width: string;
    height: string;
  }[];
  show_map: boolean;
  show_directions: boolean;
}

export const LocationBlock: FC<LocationBlockProps> = ({
  hint,
  image,
  show_directions,
  show_map,
  location,
}) => {
  const t = useTranslations("LocationMap");

  return (
    <Container asChild>
      <section className="mt-12 flex flex-col lg:flex-row lg:gap-4 lg:pb-16">
        <div className="flex flex-col justify-between lg:flex-1">
          <div className="px-4">
            <Heading type="h2">{t("location")}</Heading>
            <div className="grid grid-cols-2 items-center gap-2">
              <div className="typo-body-large">
                <p className="font-bold">{t("address")}</p>
                <p>{hint}</p>
              </div>
              {show_directions && (
                <Button variant="secondary" className="w-full" asChild>
                  <Link
                    href={`https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("getDirections")}
                    <IconArrowGuide />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="typo-body-large mt-4 px-4 font-bold">
              {t("ourGates")}
            </p>
            <div className="relative mt-4 aspect-[16/9]">
              {image[0] && image[0].url && (
                <Image
                  src={image[0].url}
                  alt={image[0].alt}
                  className="h-full w-full object-cover object-center"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>
          </div>
        </div>
        {show_map && (
          <div className="map relative box-border w-full shrink bg-neutral-100 lg:flex-1">
            <section className="map relative box-border w-full">
              <LocationMap
                location={
                  location && {
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }
                }
              />
            </section>
          </div>
        )}
      </section>
    </Container>
  );
};
