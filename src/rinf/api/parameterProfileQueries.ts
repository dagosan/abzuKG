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
  currentPlaceFilter,
  ERA_NAMESPACE,
  isSafeIri,
  SPARQL_PREFIXES,
} from "./queryParts";
import {
  datasetValues,
  OLDER_MODEL_FILTER,
  safeProperty,
} from "./scopePatterns";

/** Enough elements to tell how a type attaches, few enough to stay quick. */
const ATTACHMENT_SAMPLE_SIZE = 200;

/**
 * Element types carrying the parameter, with counts (~2 s). Types from older
 * model generations come back too and are dropped once they reach no place.
 */
export const buildCarrierTypesQuery = (
  property: string,
): string => `${SPARQL_PREFIXES}
SELECT ?type (COUNT(DISTINCT ?element) AS ?elements) WHERE {
  ?element era:${safeProperty(property)} ?anyValue ; a ?type .
  FILTER(?type != era:InfrastructureElement && STRSTARTS(STR(?type), "${ERA_NAMESPACE}"))
  ${OLDER_MODEL_FILTER}
}
GROUP BY ?type
ORDER BY DESC(?elements)`;

/**
 * How a sample of one carrier type reaches a section of line or OP: as part
 * of one, linked from one (e.g. its primary location), or through a track's
 * link — and by which link. A direct link from the place wins over a track's:
 * sidings also point to their OP's primary location. ~0.5 s.
 */
export const buildAttachmentQuery = (
  property: string,
  typeUri: string,
): string => {
  if (!isSafeIri(typeUri)) throw new Error(`Not a usable type: "${typeUri}"`);
  return `${SPARQL_PREFIXES}
SELECT ?how ?link (COUNT(*) AS ?sampled) WHERE {
  {
    SELECT DISTINCT ?element WHERE {
      ?element era:${safeProperty(property)} ?anyValue ; a <${typeUri}> .
      ${OLDER_MODEL_FILTER}
    } LIMIT ${ATTACHMENT_SAMPLE_SIZE}
  }
  OPTIONAL { ?element era:isPartOf ?container . ${currentPlaceFilter("?container")} }
  OPTIONAL {
    FILTER(!BOUND(?container))
    ?owner ?ownerLink ?element . FILTER(?ownerLink != era:isPartOf)
    ?owner a ?ownerKind . FILTER(?ownerKind IN (era:SectionOfLine, era:OperationalPoint))
    ${currentPlaceFilter("?owner")}
  }
  OPTIONAL {
    FILTER(!BOUND(?container) && !BOUND(?ownerLink))
    ?track ?trackLink ?element . FILTER(?trackLink != era:isPartOf)
    ?track era:isPartOf ?viaTrack . ${currentPlaceFilter("?viaTrack")}
  }
  BIND(IF(BOUND(?container), "partOf",
       IF(BOUND(?ownerLink), "fromPlace",
       IF(BOUND(?trackLink), "viaTrack", "none"))) AS ?how)
  BIND(COALESCE(?ownerLink, ?trackLink) AS ?link)
}
GROUP BY ?how ?link`;
};

/** The values the parameter takes within the chosen IM datasets, most used first. */
export const buildValuesInUseQuery = (
  property: string,
  datasets: string[] | null,
  limit: number,
): string => `${SPARQL_PREFIXES}
SELECT ?value (SAMPLE(?name) AS ?label) (COUNT(*) AS ?uses) WHERE {
  ${datasetValues(datasets)}
  GRAPH ?dataset { ?element era:${safeProperty(property)} ?value . }
  OPTIONAL {
    { ?value skos:prefLabel ?name FILTER(LANG(?name) = "en" || LANG(?name) = "") }
    UNION { ?value rdfs:label ?name }
  }
}
GROUP BY ?value
ORDER BY DESC(?uses)
LIMIT ${Math.trunc(limit)}`;

/** Every IM dataset with the countries of its sections of line (~3 s, once). */
export const buildScopeOptionsQuery = (): string => `${SPARQL_PREFIXES}
SELECT ?graph ?country (SAMPLE(?name) AS ?countryName)
       (COUNT(DISTINCT ?section) AS ?sections) WHERE {
  GRAPH ?graph { ?section a era:SectionOfLine ; era:inCountry ?country . }
  OPTIONAL { ?country skos:prefLabel ?name FILTER(LANG(?name) = "en") }
}
GROUP BY ?graph ?country`;
