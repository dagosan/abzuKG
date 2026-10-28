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

import type { ExpressionSpecification } from "maplibre-gl";

/** Selected OP circles are this much larger, per CLAUDE.md's focus rule. */
export const FOCUS_SCALE = 1.2;
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
export const operationalPointRadius = (
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
