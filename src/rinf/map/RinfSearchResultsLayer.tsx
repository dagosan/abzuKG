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

import { useTheme } from "@mui/material";
import type { ExpressionSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useAppSelector } from "../../store/hooks";
import { FROM_REPORT_STATE } from "../reports/reportNavigation";
import { useFitSearchResults } from "./hooks/useFitSearchResults";
import { useOpenCanonicalId } from "./hooks/useOpenCanonicalId";
import { useOpenDetailsOnClick } from "./hooks/useOpenDetailsOnClick";
import { operationalPointRadius } from "./operationalPointRadius";
import { OPERATIONAL_POINTS_LAYER_ID } from "./RinfOperationalPointsLayer";
import { buildSearchResultsGeoJson } from "./searchResultsGeoJson";
import {
  CASING_EXTRA_WIDTH,
  FOCUS_STROKE_WIDTH,
  HIT_WIDTH,
  ofKind,
  resultLineWidth,
  STROKE_WIDTH,
} from "./searchResultsPaint";
import {
  RESULT_LINES_HIT_LAYER_ID,
  RESULT_POINTS_LAYER_ID,
} from "./searchResultsLayerIds";

const SOURCE_ID = "rinf-report-results";
const CASING_LAYER_ID = "rinf-report-results-line-focus";
const LINE_LAYER_ID = "rinf-report-results-line";
/**
 * The report's results after "Show on map": every match at any zoom, in its
 * type's colour, above the faded viewport layers. Clicking one opens it with
 * a way back to the report.
 */
export const RinfSearchResultsLayer = () => {
  const theme = useTheme();
  const { places, showOnMap, resultsStatus } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );
  const openSection = useOpenCanonicalId("sectionOfLine");
  const openPoint = useOpenCanonicalId("operationalPoint");
  const geoJson = useMemo(() => buildSearchResultsGeoJson(places), [places]);
  useFitSearchResults();
  useOpenDetailsOnClick({
    kind: "sectionOfLine",
    layerId: RESULT_LINES_HIT_LAYER_ID,
    layersOnTop: [RESULT_POINTS_LAYER_ID, OPERATIONAL_POINTS_LAYER_ID],
    navigationState: FROM_REPORT_STATE,
  });
  useOpenDetailsOnClick({
    kind: "operationalPoint",
    layerId: RESULT_POINTS_LAYER_ID,
    navigationState: FROM_REPORT_STATE,
  });

  if (!showOnMap || resultsStatus !== "loaded") return null;

  const isOpenSection: ExpressionSpecification = [
    "all",
    ofKind("sectionOfLine"),
    ["==", ["get", "canonicalId"], openSection],
  ];
  const isOpenPoint: ExpressionSpecification = [
    "==",
    ["get", "canonicalId"],
    openPoint,
  ];

  return (
    <Source id={SOURCE_ID} type="geojson" data={geoJson}>
      <Layer
        id={CASING_LAYER_ID}
        type="line"
        filter={isOpenSection}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": theme.palette.warning.main,
          "line-width": resultLineWidth(CASING_EXTRA_WIDTH),
        }}
      />
      <Layer
        id={LINE_LAYER_ID}
        type="line"
        filter={ofKind("sectionOfLine")}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": theme.palette.primary.dark,
          "line-width": resultLineWidth(),
        }}
      />
      <Layer
        id={RESULT_LINES_HIT_LAYER_ID}
        type="line"
        filter={ofKind("sectionOfLine")}
        paint={{ "line-opacity": 0, "line-width": HIT_WIDTH }}
      />
      <Layer
        id={RESULT_POINTS_LAYER_ID}
        type="circle"
        filter={ofKind("operationalPoint")}
        paint={{
          "circle-color": theme.palette.secondary.main,
          "circle-radius": operationalPointRadius(isOpenPoint),
          "circle-stroke-color": [
            "case",
            isOpenPoint,
            theme.palette.warning.main,
            theme.palette.background.paper,
          ],
          "circle-stroke-width": [
            "case",
            isOpenPoint,
            FOCUS_STROKE_WIDTH,
            STROKE_WIDTH,
          ],
        }}
      />
    </Source>
  );
};
