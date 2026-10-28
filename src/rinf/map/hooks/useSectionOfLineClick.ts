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
import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useNavigate } from "react-router-dom";
import { useConfirmLeave } from "../../../components/modern/Shared/UnsavedChangesGuard";
import { sectionOfLinePath } from "../../routes";

const POINTER_CURSOR = "pointer";

/**
 * Clicking a SoL opens its panel, through Abzu's unsaved-changes guard like
 * any other navigation. A click on an OP drawn over the line is left to the OP.
 */
export const useSectionOfLineClick = (
  hitLayerId: string,
  operationalPointsLayerId: string,
): void => {
  const { current: mapRef } = useMap();
  const navigate = useNavigate();
  const confirmLeave = useConfirmLeave();
  // Ref so the map listeners, attached once, always use the latest guard.
  const openRef = useRef<(canonicalId: string) => void>(() => undefined);
  openRef.current = (canonicalId: string) =>
    confirmLeave(() => navigate(sectionOfLinePath(canonicalId)));

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const handleClick = (event: MapLayerMouseEvent) => {
      const onOperationalPoint =
        !!map.getLayer(operationalPointsLayerId) &&
        map.queryRenderedFeatures(event.point, {
          layers: [operationalPointsLayerId],
        }).length > 0;
      if (onOperationalPoint) return;
      const canonicalId = event.features?.[0]?.properties?.canonicalId as
        string | undefined;
      if (canonicalId) openRef.current(canonicalId);
    };
    const showPointer = () => {
      map.getCanvas().style.cursor = POINTER_CURSOR;
    };
    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", hitLayerId, handleClick);
    map.on("mouseenter", hitLayerId, showPointer);
    map.on("mouseleave", hitLayerId, resetCursor);
    return () => {
      map.off("click", hitLayerId, handleClick);
      map.off("mouseenter", hitLayerId, showPointer);
      map.off("mouseleave", hitLayerId, resetCursor);
      resetCursor();
    };
  }, [mapRef, hitLayerId, operationalPointsLayerId]);
};
