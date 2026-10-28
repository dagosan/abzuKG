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

import type { FeatureCollection, Point } from "geojson";
import type { OperationalPoint } from "../models/OperationalPoint";

export interface OperationalPointFeatureProperties {
  uri: string;
  uopid: string;
  name: string;
}

export const buildOperationalPointsGeoJson = (
  points: OperationalPoint[],
): FeatureCollection<Point, OperationalPointFeatureProperties> => ({
  type: "FeatureCollection",
  features: points.map(({ uri, uopid, name, lat, lng }) => ({
    type: "Feature" as const,
    properties: { uri, uopid, name },
    // GeoJSON order is [lng, lat]
    geometry: { type: "Point" as const, coordinates: [lng, lat] },
  })),
});
