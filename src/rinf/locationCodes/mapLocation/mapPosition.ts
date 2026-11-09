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

import type { BoundingBox } from "../../api/queryParts";
import type { CrdAttributes } from "../model/LocationCodeRequest";

/** A point the user chose on the map, WGS84 decimal degrees. */
export interface MapPosition {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_DEGREE_LATITUDE = 111.32;
/** CRD gives positions with 6 decimals (about 0.1 m). */
const POSITION_DECIMALS = 6;
/** Keeps the longitude span finite near the poles. */
const MIN_LATITUDE_COSINE = 0.01;

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance between two positions, in kilometres. */
export const distanceKm = (from: MapPosition, to: MapPosition): number => {
  const latitudeChange = radians(to.latitude - from.latitude);
  const longitudeChange = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeChange / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeChange / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
};

/** The box holding every point within `radiusKm` of `centre`. */
export const boxAround = (
  centre: MapPosition,
  radiusKm: number,
): BoundingBox => {
  const latitudeSpan = radiusKm / KM_PER_DEGREE_LATITUDE;
  const longitudeSpan =
    radiusKm /
    (KM_PER_DEGREE_LATITUDE *
      Math.max(Math.cos(radians(centre.latitude)), MIN_LATITUDE_COSINE));
  return {
    south: centre.latitude - latitudeSpan,
    north: centre.latitude + latitudeSpan,
    west: centre.longitude - longitudeSpan,
    east: centre.longitude + longitudeSpan,
  };
};

/** One coordinate as the form's CRD fields hold it: "50.571292". */
export const positionValue = (degrees: number): string =>
  String(Number(degrees.toFixed(POSITION_DECIMALS)));

/** The position rounded as the form will hold it. */
export const roundedPosition = (position: MapPosition): MapPosition => ({
  latitude: Number(positionValue(position.latitude)),
  longitude: Number(positionValue(position.longitude)),
});

/** "50.571292, 4.690778", for showing a position. */
export const formatPosition = (position: MapPosition): string =>
  `${positionValue(position.latitude)}, ${positionValue(position.longitude)}`;

/**
 * True while the form's latitude and longitude are still the point chosen
 * on the map: then RINF's position of the reference element must not
 * replace them.
 */
export const holdsMapPosition = (
  crd: Pick<CrdAttributes, "latitude" | "longitude">,
  position: MapPosition | null,
): boolean =>
  position !== null &&
  crd.latitude === positionValue(position.latitude) &&
  crd.longitude === positionValue(position.longitude);
