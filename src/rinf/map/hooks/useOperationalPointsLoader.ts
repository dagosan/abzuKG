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
import { useAppDispatch } from "../../../store/hooks";
import { useRinfSparqlEndpoint } from "../../config/rinfEndpoint";
import {
  clearOperationalPoints,
  fetchOperationalPointsInBox,
} from "../../state/rinfSlice";

/** Below this zoom a view covers too much of Europe to load OPs one by one. */
export const OPERATIONAL_POINTS_MIN_ZOOM = 8;
const MOVE_DEBOUNCE_MS = 500;

type PendingRequest = { abort: () => void };

/**
 * Loads the OPs in view after each map move, like neighbour stops do.
 * Lives inside <Map>, so the upstream map component needs no extra wiring.
 */
export const useOperationalPointsLoader = (enabled: boolean): void => {
  const dispatch = useAppDispatch();
  const { current: mapRef } = useMap();
  const endpoint = useRinfSparqlEndpoint();
  const endpointRef = useRef(endpoint);
  endpointRef.current = endpoint;
  const pendingRef = useRef<PendingRequest | null>(null);

  const loadVisible = useMemo(
    () =>
      debounce((map: MaplibreMap) => {
        pendingRef.current?.abort();
        if (map.getZoom() < OPERATIONAL_POINTS_MIN_ZOOM) {
          dispatch(clearOperationalPoints());
          return;
        }
        const bounds = map.getBounds();
        pendingRef.current = dispatch(
          fetchOperationalPointsInBox({
            endpoint: endpointRef.current,
            box: {
              south: bounds.getSouth(),
              west: bounds.getWest(),
              north: bounds.getNorth(),
              east: bounds.getEast(),
            },
          }),
        );
      }, MOVE_DEBOUNCE_MS),
    // endpointRef and pendingRef are stable refs — intentionally excluded
    [dispatch],
  );

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    if (!enabled) {
      loadVisible.cancel();
      pendingRef.current?.abort();
      dispatch(clearOperationalPoints());
      return;
    }

    const handleMoveEnd = () => loadVisible(map);
    loadVisible(map);
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
      loadVisible.cancel();
    };
  }, [enabled, mapRef, loadVisible, dispatch]);
};
