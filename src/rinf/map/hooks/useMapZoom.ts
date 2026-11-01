/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence.

Added for the ERA RINF frontend, 2026-11-01. */

import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";

const FALLBACK_ZOOM = 0;

/** The map's zoom, updated when a zoom ends (not on every frame, unlike useMarkerScale). */
export const useMapZoom = (): number => {
  const { current: mapRef } = useMap();
  const [zoom, setZoom] = useState<number>(
    () => mapRef?.getZoom() ?? FALLBACK_ZOOM,
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const handleZoomEnd = () => setZoom(map.getZoom());
    handleZoomEnd();
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [mapRef]);

  return zoom;
};
