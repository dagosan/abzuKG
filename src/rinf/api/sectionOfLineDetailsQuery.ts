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

import { ERA_NAMESPACE, SPARQL_PREFIXES, validOnPattern } from "./queryParts";

export const SECTION_OF_LINE_CANONICAL_PREFIX = `${ERA_NAMESPACE}sectionOfLine/`;

/** Characters that may not appear inside a SPARQL IRI, plus whitespace. */
const UNSAFE_IRI_CHARACTERS = /[\s<>"{}|\\^`]/;

/** Linked objects shown by name only, never opened as a sub-section. */
const NAME_ONLY_CLASSES = ["era:Document", "era:OrganisationRole"];

/** Links that tie a track to its context rather than describing it. */
const STRUCTURAL_LINKS = [
  "era:isPartOf",
  "era:infrastructureManager",
  "era:notApplicable",
  "era:notYetAvailable",
  "era:canonicalURI",
  "era:netReference",
  "era:validity",
  "rdf:type",
];

export const isSafeCanonicalId = (canonicalId: string): boolean =>
  canonicalId.length > 0 && !UNSAFE_IRI_CHARACTERS.test(canonicalId);

/**
 * Every statement about one SoL (level 0), its tracks (level 1) and the
 * objects its tracks link to: contact line system, ETCS, tunnels, … (level 2),
 * with a readable label for each linked value. Only the SoL version valid
 * on `validOn` is used.
 */
export const buildSectionOfLineDetailsQuery = (
  canonicalId: string,
  validOn: string,
): string => {
  if (!isSafeCanonicalId(canonicalId)) {
    throw new Error(`Not a usable section of line id: "${canonicalId}"`);
  }
  const notNameOnly = NAME_ONLY_CLASSES.map(
    (cls) => `FILTER NOT EXISTS { ?subject a ${cls} }`,
  ).join("\n      ");

  return `${SPARQL_PREFIXES}
SELECT ?level ?subject ?parent ?p ?o (SAMPLE(?label) AS ?oLabel)
WHERE {
  ?sol era:canonicalURI <${SECTION_OF_LINE_CANONICAL_PREFIX}${canonicalId}> .
  ${validOnPattern("?sol", validOn)}
  {
    BIND(?sol AS ?subject) BIND(0 AS ?level)
  } UNION {
    ?sol era:hasPart ?subject . BIND(?sol AS ?parent) BIND(1 AS ?level)
  } UNION {
    ?sol era:hasPart ?parent . ?parent ?link ?subject .
    FILTER(isIRI(?subject))
    FILTER(?link NOT IN (${STRUCTURAL_LINKS.join(", ")}))
    FILTER NOT EXISTS { ?subject a skos:Concept }
    ${notNameOnly}
    BIND(2 AS ?level)
  }
  ?subject ?p ?o .
  OPTIONAL {
    { ?o skos:prefLabel ?label FILTER(LANG(?label) = "en" || LANG(?label) = "") }
    UNION { ?o rdfs:label ?label }
  }
}
GROUP BY ?level ?subject ?parent ?p ?o`;
};
