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

/** Namespace of the ERA vocabulary; current-model resources live under it. */
export const ERA_NAMESPACE = "http://data.europa.eu/949/";

export const SPARQL_PREFIXES = `PREFIX era: <${ERA_NAMESPACE}>
PREFIX wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>`;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COORDINATE_DECIMALS = 6;
/** Characters that may not appear inside a SPARQL IRI, plus whitespace. */
const UNSAFE_IRI_CHARACTERS = /[\s<>"{}|\\^`]/;

/** An absolute http(s) URI that can go between < and > in a query. */
export const isSafeIri = (iri: string): boolean =>
  /^https?:\/\//.test(iri) && !UNSAFE_IRI_CHARACTERS.test(iri);

/** Current-model sections of line and OPs; older model generations use other URI forms. */
export const CURRENT_PLACE_PREFIXES = [
  `${ERA_NAMESPACE}sectionOfLine/`,
  `${ERA_NAMESPACE}operationalPoint/`,
];

/** FILTER keeping only current-model sections of line and OPs bound to `variable`. */
export const currentPlaceFilter = (variable: string): string =>
  `FILTER(${CURRENT_PLACE_PREFIXES.map(
    (prefix) => `STRSTARTS(STR(${variable}), "${prefix}")`,
  ).join(" || ")})`;

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Today's date as YYYY-MM-DD in the user's own time zone. */
export const todayIsoDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const formatCoordinate = (value: number): string =>
  value.toFixed(COORDINATE_DECIMALS);

/**
 * Graph patterns keeping only the version of `subject` valid on `validOn`
 * (YYYY-MM-DD). RINF resources are versioned by era:validity; one without a
 * validity period counts as always valid. The date is checked because it is
 * written into the query text.
 */
export const validOnPattern = (subject: string, validOn: string): string => {
  if (!ISO_DATE_PATTERN.test(validOn)) {
    throw new Error(`validOn must be YYYY-MM-DD, got "${validOn}"`);
  }
  const from = `${subject}ValidFrom`;
  const to = `${subject}ValidTo`;
  return `OPTIONAL { ${subject} era:validity/time:hasBeginning/time:inXSDDate ${from} }
  OPTIONAL { ${subject} era:validity/time:hasEnd/time:inXSDDate ${to} }
  FILTER((!BOUND(${from}) || ${from} <= "${validOn}"^^xsd:date)
      && (!BOUND(${to}) || ${to} >= "${validOn}"^^xsd:date))`;
};

/** WKT polygon for a bounding box, for GeoSPARQL filters. */
export const boundingBoxWkt = (box: BoundingBox): string => {
  const [south, west, north, east] = [
    box.south,
    box.west,
    box.north,
    box.east,
  ].map(formatCoordinate);
  const corners = [
    `${west} ${south}`,
    `${east} ${south}`,
    `${east} ${north}`,
    `${west} ${north}`,
    `${west} ${south}`,
  ];
  return `POLYGON((${corners.join(", ")}))`;
};

const SPARQL_STRING_ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

/** Text as a SPARQL string literal, quotes included, safe to put in a query. */
export const sparqlStringLiteral = (text: string): string =>
  `"${text.replace(/[\\"\n\r\t]/g, (character) => SPARQL_STRING_ESCAPES[character])}"`;
