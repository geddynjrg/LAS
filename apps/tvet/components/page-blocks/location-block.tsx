import { IconArrowGuide } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";

import { Heading } from "@/components/heading";
import { LocationMap } from "@/components/location-map";
import type { LocationBlockType } from "@/lib/api/schema/block/location-block.schema";

export interface LocationBlockProps extends LocationBlockType {}

export const LocationBlock: FC<LocationBlockProps> = ({
  hint,
  image,
  show_directions,
  show_map,
  location,
}) => {
  return (
    <Container asChild>
      <section className="mt-12 flex flex-col lg:flex-row lg:gap-4 lg:pb-16">
        <div className="flex flex-col justify-between lg:flex-1">
          <div className="px-4">
            <Heading type="h2">Location</Heading>
            <div className="grid grid-cols-2 items-center gap-2">
              <div className="typo-body-large">
                <p className="font-bold">Address</p>
                <p>{hint}</p>
              </div>
              {show_directions && (
                <Button variant="secondary" className="w-full" asChild>
                  <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${hint.replace(" ", "+")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions <IconArrowGuide />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="typo-body-large mt-4 px-4 font-bold">Our gates</p>
            <div className="relative mt-4 aspect-[16/9]">
              {image[0] && image[0].url && (
                <Image
                  src={image[0].url}
                  alt={image[0].alt}
                  style={{
                    objectFit: "cover",
                  }}
                  fill
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
