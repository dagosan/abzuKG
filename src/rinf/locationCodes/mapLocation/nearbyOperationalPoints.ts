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

Added for the ERA RINF frontend, 2026-11-09. */

import { buildOperationalPointsQuery } from "../../api/operationalPointsQuery";
import { todayIsoDate } from "../../api/queryParts";
import { runSparqlSelect } from "../../api/sparqlClient";
import {
  OperationalPoint,
  toOperationalPoints,
} from "../../models/OperationalPoint";
import { MAP_FEATURES_LIMIT } from "../../state/loadStatus";
import { boxAround, distanceKm, MapPosition } from "./mapPosition";

/** Decided with Antonio, 2026-11-09: the 10 nearest, within 20 km. */
export const NEARBY_RADIUS_KM = 20;
export const NEARBY_COUNT = 10;

export interface NearbyOperationalPoint {
  operationalPoint: OperationalPoint;
  distanceKm: number;
}

/** The nearest OPs first, only those within the radius, at most `count`. */
export const nearestFirst = (
  position: MapPosition,
  operationalPoints: OperationalPoint[],
  radiusKm = NEARBY_RADIUS_KM,
  count = NEARBY_COUNT,
): NearbyOperationalPoint[] =>
  operationalPoints
    .map((operationalPoint) => ({
      operationalPoint,
      distanceKm: distanceKm(position, {
        latitude: operationalPoint.lat,
        longitude: operationalPoint.lng,
      }),
    }))
    .filter((nearby) => nearby.distanceKm <= radiusKm)
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, count);

/**
 * OPs valid today near a point, nearest first. Same query as the map's OP
 * layer, on a box just large enough for the radius; the distance is the
 * straight line, computed here.
 */
export const fetchNearbyOperationalPoints = async (
  endpoint: string,
  position: MapPosition,
  signal?: AbortSignal,
): Promise<NearbyOperationalPoint[]> => {
  const query = buildOperationalPointsQuery(
    boxAround(position, NEARBY_RADIUS_KM),
    MAP_FEATURES_LIMIT,
    todayIsoDate(),
  );
  const rows = await runSparqlSelect(endpoint, query, signal);
  return nearestFirst(position, toOperationalPoints(rows));
};
