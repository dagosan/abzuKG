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

import { SPARQL_PREFIXES, validOnPattern } from "./queryParts";

/** Characters that may not appear inside a SPARQL IRI, plus whitespace. */
const UNSAFE_IRI_CHARACTERS = /[\s<>"{}|\\^`]/;

/** Linked objects shown by name only, never opened as a sub-section. */
const NAME_ONLY_CLASSES = ["era:Document", "era:OrganisationRole"];

/** Links that tie a part to its context rather than describing it. */
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
 * Every statement about one element (level 0: a SoL or an OP), its parts
 * (level 1: tracks, sidings) and the objects those parts link to (level 2:
 * contact line system, ETCS, platform edges, tunnels, …), with a readable
 * label for each linked value. Only versions valid on `validOn` are used.
 *
 * Several elements can share one canonical id: a border point is declared
 * by each neighbouring IM. Each comes back as its own root, with `?source`
 * naming the IM's dataset (named graph) it was declared in.
 */
export const buildDetailsQuery = (
  canonicalPrefix: string,
  canonicalId: string,
  validOn: string,
): string => {
  if (!isSafeCanonicalId(canonicalId)) {
    throw new Error(`Not a usable RINF id: "${canonicalId}"`);
  }
  const notNameOnly = NAME_ONLY_CLASSES.map(
    (cls) => `FILTER NOT EXISTS { ?subject a ${cls} }`,
  ).join("\n    ");

  return `${SPARQL_PREFIXES}
SELECT ?level ?subject ?parent ?p ?o (SAMPLE(?label) AS ?oLabel)
       (SAMPLE(?code) AS ?oCode) (SAMPLE(?sourceGraph) AS ?source)
       (SAMPLE(?pointLat) AS ?oLat) (SAMPLE(?pointLng) AS ?oLng)
       (SAMPLE(?shape) AS ?oWkt)
WHERE {
  GRAPH ?sourceGraph { ?root era:canonicalURI <${canonicalPrefix}${canonicalId}> }
  FILTER(STRSTARTS(STR(?root), "${canonicalPrefix}"))
  ${validOnPattern("?root", validOn)}
  {
    BIND(?root AS ?subject) BIND(0 AS ?level)
  } UNION {
    ?root era:hasPart ?subject . BIND(?root AS ?parent) BIND(1 AS ?level)
  } UNION {
    ?root era:hasPart ?parent . ?parent ?link ?subject .
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
  # A primary location's label is often its name, not its code (73% on
  # 2026-10-28), so the code is fetched on its own.
  OPTIONAL { ?o era:primaryLocationCode ?code }
  # Where the element is, so the map can move to it: an OP's net references
  # carry coordinates, a SoL's carries its drawn shape.
  OPTIONAL {
    ?o wgs:lat ?pointLat ; wgs:long ?pointLng .
    FILTER(?p = era:netReference && ?level = 0)
  }
  OPTIONAL {
    ?o geo:hasGeometry/geo:asWKT ?shape .
    FILTER(?p = era:netReference && ?level = 0)
  }
}
GROUP BY ?level ?subject ?parent ?p ?o`;
};
