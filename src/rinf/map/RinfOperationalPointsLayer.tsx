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
import { selectOperationalPoint } from "../state/rinfSlice";
import { buildOperationalPointsGeoJson } from "./buildOperationalPointsGeoJson";
import { useOperationalPointClick } from "./hooks/useOperationalPointClick";
import { useOperationalPointsLoader } from "./hooks/useOperationalPointsLoader";
import { OperationalPointPopup } from "./OperationalPointPopup";

const SOURCE_ID = "rinf-operational-points";
const CIRCLE_LAYER_ID = "rinf-operational-points-circle";
const FOCUS_SCALE = 1.2;
const STROKE_WIDTH = 1.5;
const FOCUS_STROKE_WIDTH = 3;

const OVERVIEW_ZOOM = 8;
const OVERVIEW_RADIUS = 3;
const REGION_ZOOM = 12;
const REGION_RADIUS = 5;
const STREET_ZOOM = 16;
const STREET_RADIUS = 8;

/**
 * Circle radius growing with zoom, the selected OP scaled up. MapLibre only
 * accepts the zoom interpolation at the top, so the selection sits inside it.
 */
const buildRadius = (
  isSelected: ExpressionSpecification,
): ExpressionSpecification => {
  const radius = (base: number): ExpressionSpecification => [
    "case",
    isSelected,
    base * FOCUS_SCALE,
    base,
  ];
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    OVERVIEW_ZOOM,
    radius(OVERVIEW_RADIUS),
    REGION_ZOOM,
    radius(REGION_RADIUS),
    STREET_ZOOM,
    radius(STREET_RADIUS),
  ];
};

/** RINF operational points as one circle per OP; click one for details. */
export const RinfOperationalPointsLayer = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const showOperationalPoints = useAppSelector(
    (state) => state.rinf.showOperationalPoints,
  );
  const operationalPoints = useAppSelector(
    (state) => state.rinf.operationalPoints,
  );
  const selectedUri = useAppSelector(
    (state) => state.rinf.selectedOperationalPointUri,
  );

  useOperationalPointsLoader(showOperationalPoints);
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
            "circle-radius": buildRadius(isSelected),
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
