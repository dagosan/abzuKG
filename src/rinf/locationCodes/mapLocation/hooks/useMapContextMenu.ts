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

Added for the ERA RINF frontend, 2026-11-09. */

import type { MapMouseEvent } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { MapPosition } from "../mapPosition";

/** Where the user right-clicked: on the map and on the screen. */
export interface MapContextMenuAt {
  position: MapPosition;
  screenLeft: number;
  screenTop: number;
}

export interface MapContextMenu {
  openAt: MapContextMenuAt | null;
  close: () => void;
}

/**
 * Right-click on the map (long press on most touch screens) opens a menu
 * there. MapLibre only sends "contextmenu" when the right button was not
 * dragged, so rotating the map with it still works.
 */
export const useMapContextMenu = (): MapContextMenu => {
  const { current: mapRef } = useMap();
  const [openAt, setOpenAt] = useState<MapContextMenuAt | null>(null);
  const close = useCallback(() => setOpenAt(null), []);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const handleContextMenu = (event: MapMouseEvent) => {
      event.preventDefault();
      event.originalEvent.preventDefault();
      setOpenAt({
        position: {
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        },
        screenLeft: event.originalEvent.clientX,
        screenTop: event.originalEvent.clientY,
      });
    };
    map.on("contextmenu", handleContextMenu);
    return () => {
      map.off("contextmenu", handleContextMenu);
    };
  }, [mapRef]);

  return { openAt, close };
};
