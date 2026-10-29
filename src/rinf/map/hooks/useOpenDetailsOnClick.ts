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
import { DetailsKind, detailsPath } from "../../detailsKinds";

const POINTER_CURSOR = "pointer";

interface OpenDetailsOnClickOptions {
  kind: DetailsKind;
  /** Layer whose features carry a `canonicalId` property. */
  layerId: string;
  /** Layers drawn on top: a click on one of them is left to that layer. */
  layersOnTop?: string[];
  /** Router state for the opened page, e.g. that it came from the report. */
  navigationState?: object;
}

/**
 * Clicking a feature opens its details panel, through Abzu's
 * unsaved-changes guard like any other navigation.
 */
export const useOpenDetailsOnClick = ({
  kind,
  layerId,
  layersOnTop = [],
  navigationState,
}: OpenDetailsOnClickOptions): void => {
  const { current: mapRef } = useMap();
  const navigate = useNavigate();
  const confirmLeave = useConfirmLeave();
  // Ref so the map listeners, attached once, always use the latest guard.
  const openRef = useRef<(canonicalId: string) => void>(() => undefined);
  openRef.current = (canonicalId: string) =>
    confirmLeave(() =>
      navigate(detailsPath(kind, canonicalId), { state: navigationState }),
    );
  const layersOnTopKey = layersOnTop.join(",");

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    const onTop = layersOnTopKey ? layersOnTopKey.split(",") : [];

    const handleClick = (event: MapLayerMouseEvent) => {
      const presentOnTop = onTop.filter((id) => map.getLayer(id));
      const hitOnTop =
        presentOnTop.length > 0 &&
        map.queryRenderedFeatures(event.point, { layers: presentOnTop })
          .length > 0;
      if (hitOnTop) return;
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

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, showPointer);
    map.on("mouseleave", layerId, resetCursor);
    return () => {
      map.off("click", layerId, handleClick);
      map.off("mouseenter", layerId, showPointer);
      map.off("mouseleave", layerId, resetCursor);
      resetCursor();
    };
  }, [mapRef, layerId, layersOnTopKey]);
};
