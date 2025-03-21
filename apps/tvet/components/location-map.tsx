"use client";

import {
  IconMapPin,
  IconMapPinFilled,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
} from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { useState, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

import type { InstitutionType } from "@/lib/api/schema/institution.schema";

export interface LocationMapProps {
  institutes?: InstitutionType[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const LocationMap: FC<LocationMapProps> = ({ location, institutes }) => {
  const [showInfoWindow, setShowInfoWindow] = useState<InstitutionType | null>(
    null,
  );
  const [zoom, setZoom] = useState(13);
  const t = useTranslations("LocationMap");

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <div className="relative box-border w-full">
        <Map
          defaultCenter={
            institutes && institutes[0]?.location
              ? {
                  lat: institutes[0].location.latitude,
                  lng: institutes[0].location.longitude,
                }
              : {
                  lat: location?.latitude ?? 1.2921,
                  lng: location?.longitude ?? 36.817371,
                }
          }
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          disableDefaultUI={true}
          zoom={zoom}
          onZoomChanged={(zoom) => setZoom(zoom.detail.zoom)}
          className="aspect-square w-full"
          gestureHandling={"greedy"}
        >
          {institutes?.map((institute, index) => (
            <AdvancedMarker
              key={index}
              position={{
                lat: institute.location.latitude,
                lng: institute.location.longitude,
              }}
              onClick={() =>
                !showInfoWindow
                  ? setShowInfoWindow(institute)
                  : setShowInfoWindow(null)
              }
            >
              <IconMapPinFilled className="text-primary" size={32} />
            </AdvancedMarker>
          ))}
          {location && (
            <AdvancedMarker
              key="location"
              position={{
                lat: location.latitude,
                lng: location.longitude,
              }}
            >
              <IconMapPinFilled className="text-primary" size={32} />
            </AdvancedMarker>
          )}
          {institutes && showInfoWindow && (
            <InfoWindow
              onClose={() => setShowInfoWindow(null)}
              headerContent={
                <h2 className="typo-h5 whitespace-normal font-bold">
                  {showInfoWindow.title}
                </h2>
              }
              position={{
                lat: showInfoWindow.location.latitude,
                lng: showInfoWindow.location.longitude,
              }}
              pixelOffset={[0, -32]}
            >
              <div className="typo-body-medium p-2">
                <div className="mt-2 flex flex-col gap-2">
                  <p>{showInfoWindow.address.address_line}</p>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${showInfoWindow.location.latitude},${showInfoWindow.location.longitude}`}
                      className="text-foreground font-bold"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("getDirections")}
                    </a>

                    <Button asChild>
                      <a
                        href={showInfoWindow.path_alias}
                        className="cl mt-2"
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t("viewMore")}
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <Button
            onClick={() => setZoom(zoom + 1)}
            className="size-8 p-0"
            size="md"
          >
            <IconPlus />
          </Button>
          <Button
            onClick={() => setZoom(zoom - 1)}
            className="size-8 p-0"
            size="md"
          >
            <IconMinus />
          </Button>
        </div>
      </div>
    </APIProvider>
  );
};
