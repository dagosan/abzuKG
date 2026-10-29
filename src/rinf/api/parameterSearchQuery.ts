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

import type { Attachment } from "../models/parameterAttachments";
import type { ParameterCriteria } from "../models/parameterCriteria";
import { conditionPattern } from "./conditionPattern";
import {
  currentPlaceFilter,
  ERA_NAMESPACE,
  isSafeIri,
  SPARQL_PREFIXES,
  validOnPattern,
} from "./queryParts";
import {
  countryValues,
  datasetValues,
  OLDER_MODEL_FILTER,
} from "./scopePatterns";

/** The graph pattern binding ?place for one way of reaching it from ?element. */
const attachmentBranch = (attachment: Attachment): string => {
  if (attachment.how === "itself") return "BIND(?element AS ?place)";
  if (attachment.how === "partOf") return "?element era:isPartOf ?place .";
  if (!isSafeIri(attachment.link)) {
    throw new Error(`Not a usable link: "${attachment.link}"`);
  }
  return `?track <${attachment.link}> ?element ; era:isPartOf ?place .`;
};

/**
 * One row per section of line or OP (valid on `validOn`) holding elements
 * that meet the criteria, with how many, its line number (SoLs), and its
 * shape or position for the map. Only the given attachments are
 * followed — following every possible link is 10–30 times slower.
 */
export const buildParameterSearchQuery = (
  criteria: ParameterCriteria,
  attachments: Attachment[],
  datasets: string[] | null,
  limit: number,
  validOn: string,
): string => {
  if (attachments.length === 0) {
    throw new Error("The parameter reaches no section of line or OP");
  }
  const branches = attachments
    .map((attachment) => `{ ${attachmentBranch(attachment)} }`)
    .join("\n  UNION ");
  const { property, operator, value, countries } = criteria;

  return `${SPARQL_PREFIXES}
SELECT ?place (SAMPLE(?placeKind) AS ?placeType)
       (SAMPLE(?canonicalUri) AS ?canonical) (SAMPLE(?placeLabel) AS ?label)
       (SAMPLE(?country) AS ?inCountry) (SAMPLE(?dataset) AS ?imDataset)
       (COUNT(DISTINCT ?element) AS ?matches) (SAMPLE(?type) AS ?elementType)
       (SAMPLE(?shape) AS ?wkt) (SAMPLE(?lat) AS ?latitude)
       (SAMPLE(?lng) AS ?longitude) (SAMPLE(?lineNumber) AS ?line)
WHERE {
  ${datasetValues(datasets)}
  GRAPH ?dataset { ${conditionPattern(property, operator, value)} }
  ${OLDER_MODEL_FILTER}
  ${branches}
  ${currentPlaceFilter("?place")}
  ?place a ?placeKind ; era:canonicalURI ?canonicalUri ; era:inCountry ?country .
  FILTER(?placeKind IN (era:SectionOfLine, era:OperationalPoint))
  ${countryValues(countries)}
  OPTIONAL { ?place rdfs:label ?placeLabel }
  ${validOnPattern("?place", validOn)}
  # Where to draw it: a SoL's shape, an OP's position (its shape is not needed).
  OPTIONAL { FILTER(?placeKind = era:SectionOfLine)
    ?place era:netReference/geo:hasGeometry/geo:asWKT ?shape }
  OPTIONAL { FILTER(?placeKind = era:SectionOfLine)
    ?place era:nationalLine/era:lineId ?lineNumber }
  OPTIONAL { FILTER(?placeKind = era:OperationalPoint)
    ?place era:netReference ?reference . ?reference wgs:lat ?lat ; wgs:long ?lng }
  OPTIONAL {
    ?element a ?type .
    FILTER(?type != era:InfrastructureElement && STRSTARTS(STR(?type), "${ERA_NAMESPACE}"))
  }
}
GROUP BY ?place
LIMIT ${Math.trunc(limit)}`;
};
