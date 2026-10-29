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

/** Paint settings of the report results layer. */
export const HIT_WIDTH = 14;
export const CASING_EXTRA_WIDTH = 5;
export const STROKE_WIDTH = 1.5;
export const FOCUS_STROKE_WIDTH = 3;
/** Drawn from a Europe-wide view, where the viewport layers are not loaded yet. */
const CONTINENT_ZOOM = 4;
const CONTINENT_WIDTH = 1.5;
const STREET_ZOOM = 16;
const STREET_WIDTH = 4;

export const resultLineWidth = (extra = 0): ExpressionSpecification => [
  "interpolate",
  ["linear"],
  ["zoom"],
  CONTINENT_ZOOM,
  CONTINENT_WIDTH + extra,
  STREET_ZOOM,
  STREET_WIDTH + extra,
];

export const ofKind = (kind: string): ExpressionSpecification => [
  "==",
  ["get", "kind"],
  kind,
];
