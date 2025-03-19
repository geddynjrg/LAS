"use client";

import { IconMapPin, IconMinus, IconPlus } from "@tabler/icons-react";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
} from "@vis.gl/react-google-maps";
import { useState, type FC, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

import type { InstituteType } from "@/lib/api/types";

export interface LocationMapProps {
  institutes: InstituteType[];
  children?: ReactNode;
}

export const LocationMap: FC<LocationMapProps> = ({ children, institutes }) => {
  const [showInfoWindow, setShowInfoWindow] = useState<InstituteType | null>(
    null,
  );
  const [zoom, setZoom] = useState(13);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <div className="relative box-border w-full">
        <Map
          defaultCenter={
            institutes[0]?.location
              ? {
                  lat: institutes[0].location.latitude,
                  lng: institutes[0].location.longitude,
                }
              : {
                  lat: -1.286273,
                  lng: 36.817371,
                }
          }
          mapId="2471b6743fd8b796"
          disableDefaultUI={true}
          zoom={zoom}
          onZoomChanged={(zoom) => setZoom(zoom.detail.zoom)}
          className="aspect-square w-full"
        >
          {institutes.map((institute, index) => (
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
              <IconMapPin className="text-primary" />
            </AdvancedMarker>
          ))}
          {showInfoWindow && (
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
                    <span className="font-bold">Get Directions</span>
                    <Button asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${showInfoWindow.location.latitude},${showInfoWindow.location.longitude}`}
                        className="cl mt-2"
                        rel="noreferrer"
                        target="_blank"
                      >
                        View more
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
