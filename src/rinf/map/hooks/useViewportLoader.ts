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

import debounce from "lodash.debounce";
import type { Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { BoundingBox } from "../../api/queryParts";

/** Below this zoom a view covers too much of Europe to load features one by one. */
export const RINF_MIN_ZOOM = 8;
const MOVE_DEBOUNCE_MS = 500;

export interface AbortableRequest {
  abort: () => void;
}

interface ViewportLoaderOptions {
  enabled: boolean;
  /** Starts loading the features in `box`; a newer move aborts it. */
  load: (box: BoundingBox) => AbortableRequest;
  /** Empties the layer, when zoomed out too far or switched off. */
  clear: () => void;
}

const visibleBox = (map: MaplibreMap): BoundingBox => {
  const bounds = map.getBounds();
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
};

/**
 * Reloads a layer's features for the visible area after each map move, like
 * Abzu's neighbour stops. Lives inside <Map>, so the upstream map component
 * needs no extra wiring. `load` and `clear` are read through refs, so callers
 * need not memoise them.
 */
export const useViewportLoader = ({
  enabled,
  load,
  clear,
}: ViewportLoaderOptions): void => {
  const { current: mapRef } = useMap();
  const loadRef = useRef(load);
  const clearRef = useRef(clear);
  loadRef.current = load;
  clearRef.current = clear;
  const pendingRef = useRef<AbortableRequest | null>(null);

  const loadVisible = useMemo(
    () =>
      debounce((map: MaplibreMap) => {
        pendingRef.current?.abort();
        if (map.getZoom() < RINF_MIN_ZOOM) {
          clearRef.current();
          return;
        }
        pendingRef.current = loadRef.current(visibleBox(map));
      }, MOVE_DEBOUNCE_MS),
    [],
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    if (!enabled) {
      loadVisible.cancel();
      pendingRef.current?.abort();
      clearRef.current();
      return;
    }

    const handleMoveEnd = () => loadVisible(map);
    loadVisible(map);
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
      loadVisible.cancel();
    };
  }, [enabled, mapRef, loadVisible]);
};
