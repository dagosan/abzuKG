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

import type { SparqlBinding } from "../api/sparqlClient";
import { canonicalIdFromUri } from "../detailsKinds";
import { localName, sectionOfLineName } from "./labels";

/** One section of line in the search results list. */
export interface SectionOfLineSearchResult {
  canonicalId: string;
  /** "Aalter - Maria-Aalter". */
  name: string;
  /** National line number, e.g. "0504"; null when the SoL has none. */
  lineNumber: string | null;
  /** ISO 3166 alpha-3 code, e.g. "BEL". */
  countryCode: string | null;
}

export const toSectionOfLineSearchResult = (
  binding: SparqlBinding,
): SectionOfLineSearchResult | null => {
  const canonicalId = canonicalIdFromUri(
    "sectionOfLine",
    binding.canonical?.value ?? "",
  );
  if (!canonicalId) return null;
  return {
    canonicalId,
    name: binding.label?.value
      ? sectionOfLineName(binding.label.value)
      : canonicalId,
    lineNumber: binding.line?.value || null,
    countryCode: binding.inCountry?.value
      ? localName(binding.inCountry.value)
      : null,
  };
};

export const toSectionOfLineSearchResults = (
  bindings: SparqlBinding[],
): SectionOfLineSearchResult[] =>
  bindings
    .map(toSectionOfLineSearchResult)
    .filter((result): result is SectionOfLineSearchResult => result !== null);
