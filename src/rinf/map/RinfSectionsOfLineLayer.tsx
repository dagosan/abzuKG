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
import { useMatch } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { BoundingBox } from "../api/queryParts";
import { useRinfSparqlEndpoint } from "../config/rinfEndpoint";
import { SECTION_OF_LINE_PARAM, SECTION_OF_LINE_ROUTE } from "../routes";
import {
  clearSectionsOfLine,
  fetchSectionsOfLineInBox,
} from "../state/sectionsOfLineSlice";
import { buildSectionsOfLineGeoJson } from "./buildSectionsOfLineGeoJson";
import { useSectionOfLineClick } from "./hooks/useSectionOfLineClick";
import { useViewportLoader } from "./hooks/useViewportLoader";
import { OPERATIONAL_POINTS_LAYER_ID } from "./RinfOperationalPointsLayer";

const SOURCE_ID = "rinf-sections-of-line";
const CASING_LAYER_ID = "rinf-sections-of-line-focus";
const LINE_LAYER_ID = "rinf-sections-of-line-line";
const HIT_LAYER_ID = "rinf-sections-of-line-hit";
/** Invisible width around each line that still takes clicks. */
const HIT_WIDTH = 14;
const FOCUS_SCALE = 1.6;
const CASING_EXTRA_WIDTH = 5;
const OVERVIEW_ZOOM = 8;
const OVERVIEW_WIDTH = 1.5;
const STREET_ZOOM = 16;
const STREET_WIDTH = 4;

const lineWidth = (scale: number, extra = 0): ExpressionSpecification => [
  "interpolate",
  ["linear"],
  ["zoom"],
  OVERVIEW_ZOOM,
  OVERVIEW_WIDTH * scale + extra,
  STREET_ZOOM,
  STREET_WIDTH * scale + extra,
];

/**
 * Width growing with zoom, the open SoL wider. MapLibre only accepts the zoom
 * interpolation at the top, so the open/closed choice sits inside each stop.
 */
const lineWidthFocusing = (
  isOpen: ExpressionSpecification,
): ExpressionSpecification => {
  const width = (base: number): ExpressionSpecification => [
    "case",
    isOpen,
    base * FOCUS_SCALE,
    base,
  ];
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    OVERVIEW_ZOOM,
    width(OVERVIEW_WIDTH),
    STREET_ZOOM,
    width(STREET_WIDTH),
  ];
};

/** RINF sections of line as lines; click one to open its parameters panel. */
export const RinfSectionsOfLineLayer = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const show = useAppSelector((state) => state.rinf.sectionsOfLine.show);
  const sections = useAppSelector((state) => state.rinf.sectionsOfLine.items);
  const openMatch = useMatch(
    `/${SECTION_OF_LINE_ROUTE}/:${SECTION_OF_LINE_PARAM}`,
  );
  const openCanonicalId = openMatch?.params[SECTION_OF_LINE_PARAM] ?? "";

  useViewportLoader({
    enabled: show,
    load: (box: BoundingBox) =>
      dispatch(fetchSectionsOfLineInBox({ endpoint, box })),
    clear: () => dispatch(clearSectionsOfLine()),
  });
  useSectionOfLineClick(HIT_LAYER_ID, OPERATIONAL_POINTS_LAYER_ID);

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
