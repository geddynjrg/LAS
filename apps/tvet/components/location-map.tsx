"use client";

import { IconMapPin, IconMapPinFilled } from "@tabler/icons-react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";
import type { FC, ReactNode } from "react";

import type { InstituteType } from "@/lib/api/types";

export interface LocationMapProps {
  institutes: InstituteType[];
  children?: ReactNode;
}

export const LocationMap: FC<LocationMapProps> = ({ children, institutes }) => {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map
        defaultCenter={{ lat: -1.286273, lng: 36.817371 }}
        defaultZoom={12}
        mapId="2471b6743fd8b796"
        className="h-[550px] w-full"
        disableDefaultUI={true}
      >
        <AdvancedMarker
          position={{ lat: -1.286273, lng: 36.817371 }}
          title={"test"}
        >
          <IconMapPinFilled className="text-primary" size={32} />
        </AdvancedMarker>

        {institutes.map((institute, index) => (
          //   <AdvancedMarker key={index} position={position}>
          //     <IconMapPin className="text-primary" />
          //   </AdvancedMarker>
          <Marker
            key={index}
            position={{
              lat: institute.location.latitude,
              lng: institute.location.longitude,
            }}
          />
        ))}
      </Map>
    </APIProvider>
  );
};
