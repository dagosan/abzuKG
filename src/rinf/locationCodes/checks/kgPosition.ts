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

Added for the ERA RINF frontend, 2026-11-02. */

import { isSafeIri, SPARQL_PREFIXES } from "../../api/queryParts";
import { runSparqlSelect } from "../../api/sparqlClient";
import { DETAILS_KINDS, DetailsKind } from "../../detailsKinds";
import { parseWktLines } from "../../models/wkt";

/** WGS84 position, decimal degrees. */
export interface KgPosition {
  latitude: number;
  longitude: number;
}

const COORDINATE_DECIMALS = 6;
const ROW_LIMIT = 5;

/** An OP's position, or a section of line's shape (~0.7 s). */
export const buildElementPositionQuery = (
  kind: DetailsKind,
  canonicalId: string,
): string => {
  const uri = `${DETAILS_KINDS[kind].canonicalPrefix}${canonicalId}`;
  if (!isSafeIri(uri)) throw new Error(`Unsafe canonical id "${canonicalId}"`);
  return `${SPARQL_PREFIXES}
SELECT ?lat ?lng ?shape WHERE {
  ?element era:canonicalURI <${uri}> .
  { ?element era:netReference ?reference . ?reference wgs:lat ?lat ; wgs:long ?lng }
  UNION
  { ?element era:netReference/geo:hasGeometry/geo:asWKT ?shape }
}
LIMIT ${ROW_LIMIT}`;
};

const rounded = (value: number): number =>
  Number(value.toFixed(COORDINATE_DECIMALS));

/** The middle position of a line: where a section of line's code is placed. */
const middleOf = (wkt: string): KgPosition | null => {
  const positions = parseWktLines(wkt).flat();
  if (positions.length === 0) return null;
  // Most sections are a straight line OP to OP: the average of the two
  // middle positions is then halfway.
  const last = positions.length - 1;
  const [lngA, latA] = positions[Math.floor(last / 2)];
  const [lngB, latB] = positions[Math.ceil(last / 2)];
  return {
    latitude: rounded((latA + latB) / 2),
    longitude: rounded((lngA + lngB) / 2),
  };
};

/** Where RINF places the element, for CRD's Latitude and Longitude; null when unknown. */
export const fetchElementPosition = async (
  endpoint: string,
  kind: DetailsKind,
  canonicalId: string,
  signal?: AbortSignal,
): Promise<KgPosition | null> => {
  const rows = await runSparqlSelect(
    endpoint,
    buildElementPositionQuery(kind, canonicalId),
    signal,
  );
  const point = rows.find((row) => row.lat && row.lng);
  if (point?.lat && point.lng)
    return {
      latitude: rounded(Number(point.lat.value)),
      longitude: rounded(Number(point.lng.value)),
    };
  const shape = rows.find((row) => row.shape)?.shape?.value;
  return shape ? middleOf(shape) : null;
};
