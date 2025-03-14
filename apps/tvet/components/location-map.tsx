"use client";

import { IconMapPin } from "@tabler/icons-react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";
import type { FC, ReactNode } from "react";

export interface LocationMapProps {
  positions: Array<{ lat: number; lng: number }>;
  children?: ReactNode;
}

export const LocationMap: FC<LocationMapProps> = ({ children, positions }) => {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <Map defaultZoom={10}>
        {positions.map((position, index) => (
          //   <AdvancedMarker key={index} position={position}>
          //     <IconMapPin className="text-primary" />
          //   </AdvancedMarker>
          <Marker key={index} position={position} />
        ))}
      </Map>
    </APIProvider>
  );
};
