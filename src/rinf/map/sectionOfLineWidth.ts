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

import type { ExpressionSpecification } from "maplibre-gl";

/** Line widths of the sections of line layer, growing with zoom. */
export const FOCUS_SCALE = 1.6;
export const CASING_EXTRA_WIDTH = 5;
const OVERVIEW_ZOOM = 8;
const OVERVIEW_WIDTH = 1.5;
const STREET_ZOOM = 16;
const STREET_WIDTH = 4;

export const lineWidth = (
  scale: number,
  extra = 0,
): ExpressionSpecification => [
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
export const lineWidthFocusing = (
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
