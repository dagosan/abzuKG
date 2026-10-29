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

const CURRENT_MODEL_SOL_PREFIX = `${ERA_NAMESPACE}sectionOfLine/`;
const ID_SEPARATOR = "/sectionOfLine/";

/**
 * SPARQL expression: a SoL label without its boilerplate, so that text such
 * as "line", "20" or "from" does not match every label. Labels read
 * "Section of Line A - B (from … until …)" or, in Polish data,
 * "[PL0051003] SOL A - B". (Backslashes are doubled once for SPARQL.)
 */
const nameOnly = (label: string): string =>
  `REPLACE(REPLACE(STR(${label}), "^(Section of Line |\\\\[[^\\\\]]*\\\\] SOL )", ""), " \\\\(from [^)]*\\\\)$", "")`;

/**
 * SoLs valid on `validOn` whose national line number starts with `text`, or
 * whose name or canonical id contains it (case ignored). Ranked: exact line
 * number or id first, then line numbers starting with the text, then names
 * starting with it, then the rest; within a rank by line, then name.
 *
 * Ids and names are matched in one scan of SoLs (~2.5 s); matching ids on
 * every element with a canonical URI takes ~7 s.
 */
export const buildSectionOfLineSearchQuery = (
  text: string,
  limit: number,
  validOn: string,
): string => {
  const wanted = `LCASE(${sparqlStringLiteral(text.trim())})`;
  return `${SPARQL_PREFIXES}
SELECT ?canonical (SAMPLE(?name) AS ?label) (SAMPLE(?lineNumber) AS ?line)
       (SAMPLE(?country) AS ?inCountry) (MIN(?rank) AS ?bestRank)
WHERE {
  {
    SELECT DISTINCT ?sol WHERE {
      { ?anyLine era:lineId ?anyLineId .
        FILTER(STRSTARTS(LCASE(STR(?anyLineId)), ${wanted}))
        ?sol era:nationalLine ?anyLine }
      UNION { ?sol a era:SectionOfLine ; era:canonicalURI ?anyCanonical ;
          rdfs:label ?anyLabel .
        FILTER(CONTAINS(LCASE(STRAFTER(STR(?anyCanonical), "${ID_SEPARATOR}")), ${wanted})
          || CONTAINS(LCASE(${nameOnly("?anyLabel")}), ${wanted})) }
    }
  }
  FILTER(STRSTARTS(STR(?sol), "${CURRENT_MODEL_SOL_PREFIX}"))
  ?sol a era:SectionOfLine ; era:canonicalURI ?canonical ; rdfs:label ?name .
  OPTIONAL { ?sol era:nationalLine/era:lineId ?lineNumber }
  OPTIONAL { ?sol era:inCountry ?country }
  ${validOnPattern("?sol", validOn)}
  BIND(LCASE(STRAFTER(STR(?canonical), "${ID_SEPARATOR}")) AS ?lowerId)
  BIND(LCASE(STR(COALESCE(?lineNumber, ""))) AS ?lowerLine)
  BIND(IF(?lowerId = ${wanted} || ?lowerLine = ${wanted}, 0,
       IF(STRSTARTS(?lowerLine, ${wanted}), 1,
       IF(STRSTARTS(LCASE(${nameOnly("?name")}), ${wanted}), 2, 3))) AS ?rank)
}
GROUP BY ?canonical
ORDER BY ?bestRank LCASE(STR(SAMPLE(?lineNumber))) LCASE(STR(?label))
LIMIT ${Math.trunc(limit)}`;
};
