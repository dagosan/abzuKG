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
  boundingBoxWkt,
  ERA_NAMESPACE,
  SPARQL_PREFIXES,
  validOnPattern,
} from "./queryParts";

const CURRENT_MODEL_SOL_PREFIX = `${ERA_NAMESPACE}sectionOfLine/`;

/**
 * One row per SoL version valid on `validOn` whose shape crosses the box.
 * The geographic test also finds a long SoL crossing the view when both of
 * its end OPs are outside it.
 */
export const buildSectionsOfLineQuery = (
  box: BoundingBox,
  limit: number,
  validOn: string,
): string => `${SPARQL_PREFIXES}
SELECT ?sol (SAMPLE(?canonical) AS ?canonicalUri) (SAMPLE(?name) AS ?label)
       (SAMPLE(?shape) AS ?wkt)
WHERE {
  ?sol era:netReference/geo:hasGeometry/geo:asWKT ?shape .
  FILTER(geof:sfIntersects(?shape, "${boundingBoxWkt(box)}"^^geo:wktLiteral))
  ?sol a era:SectionOfLine .
  FILTER(STRSTARTS(STR(?sol), "${CURRENT_MODEL_SOL_PREFIX}"))
  OPTIONAL { ?sol era:canonicalURI ?canonical }
  OPTIONAL { ?sol rdfs:label ?name }
  ${validOnPattern("?sol", validOn)}
}
GROUP BY ?sol
LIMIT ${Math.trunc(limit)}`;
