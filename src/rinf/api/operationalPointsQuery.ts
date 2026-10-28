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

/** Current-model OPs only; older model generations in the same repository use other URI forms. */
const CURRENT_MODEL_OP_PREFIX = "http://data.europa.eu/949/operationalPoint/";
const COORDINATE_DECIMALS = 6;

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatCoordinate = (value: number): string =>
  value.toFixed(COORDINATE_DECIMALS);

/** Today's date as YYYY-MM-DD in the user's own time zone. */
export const todayIsoDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * One row per OP version inside the box that is valid on `validOn`
 * (YYYY-MM-DD). OPs are versioned by validity period; an OP without one
 * counts as always valid. An OP has one net reference per line it sits on,
 * all at the same position, so rows are grouped and one value sampled.
 */
export const buildOperationalPointsQuery = (
  box: BoundingBox,
  limit: number,
  validOn: string,
): string => {
  if (!ISO_DATE_PATTERN.test(validOn)) {
    throw new Error(`validOn must be YYYY-MM-DD, got "${validOn}"`);
  }
  return `PREFIX era: <http://data.europa.eu/949/>
PREFIX wgs: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?op (SAMPLE(?uopid) AS ?id) (SAMPLE(?name) AS ?label)
       (SAMPLE(?type) AS ?opType) (SAMPLE(?country) AS ?inCountry)
       (SAMPLE(?lat) AS ?latitude) (SAMPLE(?lng) AS ?longitude)
WHERE {
  ?op a era:OperationalPoint ;
      era:uopid ?uopid ;
      era:netReference ?reference .
  ?reference wgs:lat ?lat ; wgs:long ?lng .
  OPTIONAL { ?op era:opName ?name }
  OPTIONAL { ?op era:opType ?type }
  OPTIONAL { ?op era:inCountry ?country }
  FILTER(STRSTARTS(STR(?op), "${CURRENT_MODEL_OP_PREFIX}"))
  FILTER(?lat >= ${formatCoordinate(box.south)} && ?lat <= ${formatCoordinate(box.north)}
      && ?lng >= ${formatCoordinate(box.west)} && ?lng <= ${formatCoordinate(box.east)})
  OPTIONAL { ?op era:validity/time:hasBeginning/time:inXSDDate ?validFrom }
  OPTIONAL { ?op era:validity/time:hasEnd/time:inXSDDate ?validTo }
  FILTER((!BOUND(?validFrom) || ?validFrom <= "${validOn}"^^xsd:date)
      && (!BOUND(?validTo) || ?validTo >= "${validOn}"^^xsd:date))
}
GROUP BY ?op
LIMIT ${Math.trunc(limit)}`;
};
