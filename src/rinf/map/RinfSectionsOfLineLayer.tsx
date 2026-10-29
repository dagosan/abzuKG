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
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { BoundingBox } from "../api/queryParts";
import { useRinfSparqlEndpoint } from "../config/rinfEndpoint";
import {
  clearSectionsOfLine,
  fetchSectionsOfLineInBox,
} from "../state/sectionsOfLineSlice";
import { buildSectionsOfLineGeoJson } from "./buildSectionsOfLineGeoJson";
import { useOpenCanonicalId } from "./hooks/useOpenCanonicalId";
import { useMatchedIds } from "./hooks/useMatchedIds";
import { useOpenDetailsOnClick } from "./hooks/useOpenDetailsOnClick";
import { useViewportLoader } from "./hooks/useViewportLoader";
import { matchOpacity } from "./matchOpacity";
import {
  CASING_EXTRA_WIDTH,
  FOCUS_SCALE,
  lineWidth,
  lineWidthFocusing,
} from "./sectionOfLineWidth";
import { OPERATIONAL_POINTS_LAYER_ID } from "./RinfOperationalPointsLayer";
import {
  RESULT_LINES_HIT_LAYER_ID,
  RESULT_POINTS_LAYER_ID,
} from "./searchResultsLayerIds";

const SOURCE_ID = "rinf-sections-of-line";
const CASING_LAYER_ID = "rinf-sections-of-line-focus";
const LINE_LAYER_ID = "rinf-sections-of-line-line";
const HIT_LAYER_ID = "rinf-sections-of-line-hit";
/** Invisible width around each line that still takes clicks. */
const HIT_WIDTH = 14;
/** RINF sections of line as lines; click one to open its parameters panel. */
export const RinfSectionsOfLineLayer = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const show = useAppSelector((state) => state.rinf.sectionsOfLine.show);
  const sections = useAppSelector((state) => state.rinf.sectionsOfLine.items);
  const openCanonicalId = useOpenCanonicalId("sectionOfLine");
  const matched = useMatchedIds("sectionOfLine");
  const opacity = useMemo(() => matchOpacity(matched), [matched]);

  useViewportLoader({
    enabled: show,
    load: (box: BoundingBox) =>
      dispatch(fetchSectionsOfLineInBox({ endpoint, box })),
    clear: () => dispatch(clearSectionsOfLine()),
  });
  useOpenDetailsOnClick({
    kind: "sectionOfLine",
    layerId: HIT_LAYER_ID,
    // Report results drawn on top open with a way back to the report.
    layersOnTop: [
      OPERATIONAL_POINTS_LAYER_ID,
      RESULT_LINES_HIT_LAYER_ID,
      RESULT_POINTS_LAYER_ID,
    ],
  });

  const geoJson = useMemo(
    () => buildSectionsOfLineGeoJson(sections),
    [sections],
  );

  if (!show) return null;

  const isOpen: ExpressionSpecification = [
    "==",
    ["get", "canonicalId"],
    openCanonicalId,
  ];

  return (
    <Source id={SOURCE_ID} type="geojson" data={geoJson}>
      <Layer
        id={CASING_LAYER_ID}
        type="line"
        filter={isOpen}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": theme.palette.warning.main,
          "line-width": lineWidth(FOCUS_SCALE, CASING_EXTRA_WIDTH),
        }}
      />
      <Layer
        id={LINE_LAYER_ID}
        type="line"
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": theme.palette.primary.dark,
          "line-width": lineWidthFocusing(isOpen),
          "line-opacity": opacity,
        }}
      />
      <Layer
        id={HIT_LAYER_ID}
        type="line"
        paint={{
          "line-color": theme.palette.primary.dark,
          "line-opacity": 0,
          "line-width": HIT_WIDTH,
        }}
      />
    </Source>
  );
};
