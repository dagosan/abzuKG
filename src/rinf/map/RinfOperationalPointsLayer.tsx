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

import { useTheme } from "@mui/material";
import type { ExpressionSpecification } from "maplibre-gl";
import { useCallback, useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useRinfSparqlEndpoint } from "../config/rinfEndpoint";
import type { BoundingBox } from "../api/queryParts";
import {
  clearOperationalPoints,
  fetchOperationalPointsInBox,
  selectOperationalPoint,
} from "../state/operationalPointsSlice";
import { buildOperationalPointsGeoJson } from "./buildOperationalPointsGeoJson";
import { useOperationalPointClick } from "./hooks/useOperationalPointClick";
import { useViewportLoader } from "./hooks/useViewportLoader";
import { operationalPointRadius } from "./operationalPointRadius";
import { OperationalPointPopup } from "./OperationalPointPopup";

const SOURCE_ID = "rinf-operational-points";
/** Exported so other layers can tell when a click landed on an OP. */
export const OPERATIONAL_POINTS_LAYER_ID = "rinf-operational-points-circle";
const CIRCLE_LAYER_ID = OPERATIONAL_POINTS_LAYER_ID;
const STROKE_WIDTH = 1.5;
const FOCUS_STROKE_WIDTH = 3;

/** RINF operational points as one circle per OP; click one for details. */
export const RinfOperationalPointsLayer = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const showOperationalPoints = useAppSelector(
    (state) => state.rinf.operationalPoints.show,
  );
  const operationalPoints = useAppSelector(
    (state) => state.rinf.operationalPoints.items,
  );
  const selectedUri = useAppSelector(
    (state) => state.rinf.operationalPoints.selectedUri,
  );

  useViewportLoader({
    enabled: showOperationalPoints,
    load: (box: BoundingBox) =>
      dispatch(fetchOperationalPointsInBox({ endpoint, box })),
    clear: () => dispatch(clearOperationalPoints()),
  });
  useOperationalPointClick(CIRCLE_LAYER_ID);

  const geoJson = useMemo(
    () => buildOperationalPointsGeoJson(operationalPoints),
    [operationalPoints],
  );
  const selectedPoint = useMemo(
    () => operationalPoints.find((point) => point.uri === selectedUri) ?? null,
    [operationalPoints, selectedUri],
  );
  const handleClosePopup = useCallback(
    () => dispatch(selectOperationalPoint(null)),
    [dispatch],
  );

  if (!showOperationalPoints) return null;

  const isSelected: ExpressionSpecification = [
    "==",
    ["get", "uri"],
    selectedUri ?? "",
  ];

  return (
    <>
      <Source id={SOURCE_ID} type="geojson" data={geoJson}>
        <Layer
          id={CIRCLE_LAYER_ID}
          type="circle"
          paint={{
            "circle-color": theme.palette.secondary.main,
            "circle-radius": operationalPointRadius(isSelected),
            "circle-stroke-color": [
              "case",
              isSelected,
              theme.palette.warning.main,
              theme.palette.background.paper,
            ],
            "circle-stroke-width": [
              "case",
              isSelected,
              FOCUS_STROKE_WIDTH,
              STROKE_WIDTH,
            ],
          }}
        />
      </Source>
      {selectedPoint && (
        <OperationalPointPopup
          point={selectedPoint}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
};
