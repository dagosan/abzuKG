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

import {
  BoundingBox,
  ERA_NAMESPACE,
  formatCoordinate,
  SPARQL_PREFIXES,
  validOnPattern,
} from "./queryParts";

/** Current-model OPs only; older model generations in the same repository use other URI forms. */
const CURRENT_MODEL_OP_PREFIX = `${ERA_NAMESPACE}operationalPoint/`;

/**
 * One row per OP version inside the box that is valid on `validOn`
 * (YYYY-MM-DD). An OP has one net reference per line it sits on, all at the
 * same position, so rows are grouped and one value sampled.
 */
export const buildOperationalPointsQuery = (
  box: BoundingBox,
  limit: number,
  validOn: string,
): string => `${SPARQL_PREFIXES}
SELECT ?op (SAMPLE(?uopid) AS ?id) (SAMPLE(?canonical) AS ?canonicalUri)
       (SAMPLE(?name) AS ?label)
       (SAMPLE(?lat) AS ?latitude) (SAMPLE(?lng) AS ?longitude)
WHERE {
  ?op a era:OperationalPoint ;
      era:uopid ?uopid ;
      era:canonicalURI ?canonical ;
      era:netReference ?reference .
  ?reference wgs:lat ?lat ; wgs:long ?lng .
  OPTIONAL { ?op era:opName ?name }
  FILTER(STRSTARTS(STR(?op), "${CURRENT_MODEL_OP_PREFIX}"))
  FILTER(?lat >= ${formatCoordinate(box.south)} && ?lat <= ${formatCoordinate(box.north)}
      && ?lng >= ${formatCoordinate(box.west)} && ?lng <= ${formatCoordinate(box.east)})
  ${validOnPattern("?op", validOn)}
}
GROUP BY ?op
LIMIT ${Math.trunc(limit)}`;
