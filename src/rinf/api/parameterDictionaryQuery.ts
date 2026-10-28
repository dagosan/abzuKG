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

import { ERA_NAMESPACE, SPARQL_PREFIXES } from "./queryParts";

/**
 * Label, RINF index and unit of every property and class in the ERA
 * vocabulary (~750 rows, ~70 KB). Loaded once per session and used to name,
 * order and give units to the parameters in the panel.
 */
export const buildParameterDictionaryQuery = (): string => `${SPARQL_PREFIXES}
SELECT ?term (SAMPLE(?name) AS ?label) (SAMPLE(?index) AS ?rinfIndex)
       (SAMPLE(?unitUri) AS ?unit)
WHERE {
  ?term rdfs:label ?name .
  FILTER(STRSTARTS(STR(?term), "${ERA_NAMESPACE}"))
  FILTER(LANG(?name) = "en" || LANG(?name) = "")
  { ?term a owl:DatatypeProperty } UNION { ?term a owl:ObjectProperty }
  UNION { ?term a owl:Class } UNION { ?term era:rinfIndex ?anyIndex }
  OPTIONAL { ?term era:rinfIndex ?index }
  OPTIONAL { ?term era:unitOfMeasure ?unitUri }
}
GROUP BY ?term`;
