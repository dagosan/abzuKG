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
  isSafeIri,
  SPARQL_PREFIXES,
  sparqlStringLiteral,
} from "../../api/queryParts";
import { DETAILS_KINDS, DetailsKind } from "../../detailsKinds";

/** Every primary location code with the country prefix (~1.4 s for DE). */
export const buildCountryCodesQuery = (
  country: string,
): string => `${SPARQL_PREFIXES}
SELECT DISTINCT ?code WHERE {
  ?location era:primaryLocationCode ?code .
  FILTER(STRSTARTS(?code, ${sparqlStringLiteral(country)}))
}`;

/** A primary location code: its names and the OPs pointing at it (~0.8 s). */
export const buildPrimaryCodeQuery = (
  code: string,
): string => `${SPARQL_PREFIXES}
SELECT ?location ?name ?uopid ?canonical WHERE {
  ?location era:primaryLocationCode ${sparqlStringLiteral(code)} .
  OPTIONAL { ?location era:primaryLocationName ?name }
  OPTIONAL {
    ?op era:primaryLocation ?location ; era:uopid ?uopid .
    OPTIONAL { ?op era:canonicalURI ?canonical }
  }
}
LIMIT 50`;

/** Subsidiary codes linked to a primary location code (~0.6 s). */
export const buildSubsidiaryCodesQuery = (
  primaryCode: string,
): string => `${SPARQL_PREFIXES}
SELECT DISTINCT ?code WHERE {
  ?location era:primaryLocationCode ${sparqlStringLiteral(primaryCode)} .
  ?subsidiary era:linkedToPrimaryLocation ?location ;
              era:subsidiaryLocationCode ?code .
}`;

/**
 * The versions of a RINF element with their validity, the IM dataset
 * (named graph) declaring each, and what the form can reuse: name, UOPID,
 * country and the primary location codes each version carries (~0.6 s).
 */
export const buildElementCodesQuery = (
  kind: DetailsKind,
  canonicalId: string,
): string => {
  const uri = `${DETAILS_KINDS[kind].canonicalPrefix}${canonicalId}`;
  if (!isSafeIri(uri)) throw new Error(`Unsafe canonical id "${canonicalId}"`);
  return `${SPARQL_PREFIXES}
SELECT ?element ?graph ?code ?from ?to ?label ?name ?uopid ?country WHERE {
  GRAPH ?graph { ?element era:canonicalURI <${uri}> }
  OPTIONAL { ?element rdfs:label ?label }
  OPTIONAL { ?element era:opName ?name }
  OPTIONAL { ?element era:uopid ?uopid }
  OPTIONAL { ?element era:inCountry ?country }
  OPTIONAL { ?element era:primaryLocation/era:primaryLocationCode ?code }
  OPTIONAL { ?element era:validity/time:hasBeginning/time:inXSDDate ?from }
  OPTIONAL { ?element era:validity/time:hasEnd/time:inXSDDate ?to }
}
LIMIT 100`;
};
