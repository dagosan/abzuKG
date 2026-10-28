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

import {
  ERA_NAMESPACE,
  SPARQL_PREFIXES,
  sparqlStringLiteral,
  validOnPattern,
} from "./queryParts";

const CURRENT_MODEL_OP_PREFIX = `${ERA_NAMESPACE}operationalPoint/`;

/** Shorter text matches too much of Europe to be quick or useful. */
export const MIN_SEARCH_LENGTH = 2;

/**
 * OPs valid on `validOn` whose name contains `text`, or whose UOPID or
 * primary location code starts with it (case ignored). Ranked: exact UOPID
 * or code first, then names starting with the text, then other names.
 *
 * The endpoint has no full-text index, so matching OPs are found first and
 * only those are looked up in detail: about 2–3 s instead of 5–7 s.
 */
export const buildOperationalPointSearchQuery = (
  text: string,
  limit: number,
  validOn: string,
): string => {
  const wanted = `LCASE(${sparqlStringLiteral(text.trim())})`;
  return `${SPARQL_PREFIXES}
SELECT ?canonical (SAMPLE(?name) AS ?label) (SAMPLE(?uopid) AS ?id)
       (SAMPLE(?code) AS ?locationCode) (SAMPLE(?typeLabel) AS ?type)
       (SAMPLE(?country) AS ?inCountry) (MIN(?rank) AS ?bestRank)
WHERE {
  {
    SELECT DISTINCT ?op WHERE {
      { ?op era:opName ?anyName .
        FILTER(CONTAINS(LCASE(STR(?anyName)), ${wanted})) }
      UNION { ?op era:uopid ?anyId .
        FILTER(STRSTARTS(LCASE(STR(?anyId)), ${wanted})) }
      UNION { ?anyLocation era:primaryLocationCode ?anyCode .
        FILTER(STRSTARTS(LCASE(STR(?anyCode)), ${wanted}))
        ?op era:primaryLocation ?anyLocation }
    }
  }
  FILTER(STRSTARTS(STR(?op), "${CURRENT_MODEL_OP_PREFIX}"))
  ?op era:canonicalURI ?canonical ; era:uopid ?uopid ; era:opName ?name .
  OPTIONAL { ?op era:primaryLocation/era:primaryLocationCode ?code }
  ${validOnPattern("?op", validOn)}
  OPTIONAL {
    ?op era:opType/skos:prefLabel ?typeLabel .
    FILTER(LANG(?typeLabel) = "en" || LANG(?typeLabel) = "")
  }
  OPTIONAL { ?op era:inCountry ?country }
  BIND(LCASE(STR(COALESCE(?code, ""))) AS ?lowerCode)
  BIND(LCASE(STR(?name)) AS ?lowerName)
  BIND(IF(LCASE(STR(?uopid)) = ${wanted} || ?lowerCode = ${wanted}, 0,
       IF(STRSTARTS(?lowerName, ${wanted}), 1,
       IF(CONTAINS(?lowerName, ${wanted}), 2, 3))) AS ?rank)
}
GROUP BY ?canonical
ORDER BY ?bestRank LCASE(STR(?label))
LIMIT ${Math.trunc(limit)}`;
};
