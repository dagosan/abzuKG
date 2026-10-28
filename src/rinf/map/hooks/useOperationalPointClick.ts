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

Added for the ERA RINF frontend, 2026-10-28. */

import type { MapLayerMouseEvent } from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useAppDispatch } from "../../../store/hooks";
import { selectOperationalPoint } from "../../state/operationalPointsSlice";

const POINTER_CURSOR = "pointer";

/** Clicking an OP circle selects it; the cursor shows the circles are clickable. */
export const useOperationalPointClick = (layerId: string): void => {
  const dispatch = useAppDispatch();
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const handleClick = (event: MapLayerMouseEvent) => {
      const uri = event.features?.[0]?.properties?.uri as string | undefined;
      if (uri) dispatch(selectOperationalPoint(uri));
    };
    const showPointer = () => {
      map.getCanvas().style.cursor = POINTER_CURSOR;
    };
    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, showPointer);
    map.on("mouseleave", layerId, resetCursor);
    return () => {
      map.off("click", layerId, handleClick);
      map.off("mouseenter", layerId, showPointer);
      map.off("mouseleave", layerId, resetCursor);
      resetCursor();
    };
  }, [mapRef, layerId, dispatch]);
};
