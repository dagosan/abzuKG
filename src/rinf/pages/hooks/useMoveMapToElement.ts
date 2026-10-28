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

Added for the ERA RINF frontend, 2026-10-29. */

import type { Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useAppSelector } from "../../../store/hooks";
import type { DetailsKind } from "../../detailsKinds";
import { RINF_MIN_ZOOM } from "../../map/hooks/useViewportLoader";
import { DRAWER_WIDTH_DESKTOP } from "../../panel/panelWidth";

const FLY_DURATION_MS = 800;
/** Close enough to see the element among its neighbours. */
const TARGET_ZOOM: Record<DetailsKind, number> = {
  operationalPoint: 14,
  sectionOfLine: 12,
};
/** Only a map at least this much wider than the panel is shifted for it. */
const PANEL_SHIFT_MIN_RATIO = 2;

/** Width of map the panel covers on the left; 0 on narrow screens where it covers all. */
const coveredWidth = (map: MaplibreMap): number =>
  map.getContainer().clientWidth > DRAWER_WIDTH_DESKTOP * PANEL_SHIFT_MIN_RATIO
    ? DRAWER_WIDTH_DESKTOP
    : 0;

/** True when the point is on the part of the map the panel leaves visible. */
const isVisible = (map: MaplibreMap, lng: number, lat: number): boolean => {
  const { x, y } = map.project([lng, lat]);
  const { clientWidth, clientHeight } = map.getContainer();
  return (
    x >= coveredWidth(map) && x <= clientWidth && y >= 0 && y <= clientHeight
  );
};

/**
 * Moves the map to the open element, once per element, when it is out of
 * sight or the map is zoomed out too far to draw it — for a link or a search
 * result. An element clicked on the map is already in view and stays put.
 */
export const useMoveMapToElement = (
  kind: DetailsKind,
  position: [number, number] | null,
): void => {
  const activeMap = useAppSelector(
    (state) => (state as any).mapUtils?.activeMap as MaplibreMap | undefined,
  );
  const movedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeMap || !position) return;
    const key = `${kind}:${position.join(",")}`;
    if (movedForRef.current === key) return;
    movedForRef.current = key;

    const [lat, lng] = position;
    const zoom = activeMap.getZoom();
    if (zoom >= RINF_MIN_ZOOM && isVisible(activeMap, lng, lat)) return;
    activeMap.flyTo({
      center: [lng, lat],
      zoom: Math.max(zoom, TARGET_ZOOM[kind]),
      // Centre the element in the part of the map beside the panel.
      offset: [coveredWidth(activeMap) / 2, 0],
      duration: FLY_DURATION_MS,
    });
  }, [activeMap, kind, position]);
};
