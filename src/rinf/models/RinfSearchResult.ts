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

import type { OperationalPointSearchResult } from "./OperationalPointSearchResult";
import type { SectionOfLineSearchResult } from "./SectionOfLineSearchResult";

/** One entry of the header search list: an OP or a section of line. */
export type RinfSearchResult =
  | ({ kind: "operationalPoint" } & OperationalPointSearchResult)
  | ({ kind: "sectionOfLine" } & SectionOfLineSearchResult);

/** OPs first, then sections of line, each in the order the search ranked them. */
export const combineSearchResults = (
  operationalPoints: OperationalPointSearchResult[],
  sectionsOfLine: SectionOfLineSearchResult[],
): RinfSearchResult[] => [
  ...operationalPoints.map((result) => ({
    kind: "operationalPoint" as const,
    ...result,
  })),
  ...sectionsOfLine.map((result) => ({
    kind: "sectionOfLine" as const,
    ...result,
  })),
];

/** Unique across both kinds: an OP and a SoL could share an id. */
export const searchResultKey = ({ kind, canonicalId }: RinfSearchResult) =>
  `${kind}:${canonicalId}`;
