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

import type { FeatureCollection, Geometry, Position } from "geojson";
import type { LngLatBoundsLike } from "maplibre-gl";
import type { DetailsKind } from "../detailsKinds";
import type { PlaceMatch } from "../models/parameterMatches";

export interface SearchResultProperties {
  canonicalId: string;
  kind: DetailsKind;
}

const geometryOf = (place: PlaceMatch): Geometry | null => {
  if (place.kind === "sectionOfLine") {
    return place.lines.length > 0
      ? { type: "MultiLineString", coordinates: place.lines }
      : null;
  }
  return place.lngLat ? { type: "Point", coordinates: place.lngLat } : null;
};

/** The report's results as map features; places without a shape or position are left out. */
export const buildSearchResultsGeoJson = (
  places: PlaceMatch[],
): FeatureCollection<Geometry, SearchResultProperties> => ({
  type: "FeatureCollection",
  features: places.flatMap((place) => {
    const geometry = geometryOf(place);
    return geometry
      ? [
          {
            type: "Feature" as const,
            properties: { canonicalId: place.canonicalId, kind: place.kind },
            geometry,
          },
        ]
      : [];
  }),
});

const positionsOf = (place: PlaceMatch): Position[] =>
  place.kind === "sectionOfLine"
    ? place.lines.flat()
    : place.lngLat
      ? [place.lngLat]
      : [];

/** [[west, south], [east, north]] around every result; null when none can be drawn. */
export const searchResultsBounds = (
  places: PlaceMatch[],
): LngLatBoundsLike | null => {
  // A loop, not Math.min(...all): thousands of shapes can hold too many
  // positions to pass as arguments.
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  places.flatMap(positionsOf).forEach(([lng, lat]) => {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  });
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north],
      ]
    : null;
};
