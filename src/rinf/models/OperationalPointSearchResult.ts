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
import { localName } from "./labels";

/** One row of the search results list. */
export interface OperationalPointSearchResult {
  canonicalId: string;
  name: string;
  uopid: string;
  /** Primary location code, e.g. "BE00438"; null when the OP has none. */
  locationCode: string | null;
  /** Type label from the code list, e.g. "station". */
  type: string | null;
  /** ISO 3166 alpha-3 code, e.g. "BEL". */
  countryCode: string | null;
}

export const toOperationalPointSearchResult = (
  binding: SparqlBinding,
): OperationalPointSearchResult | null => {
  const canonicalId = canonicalIdFromUri(
    "operationalPoint",
    binding.canonical?.value ?? "",
  );
  const uopid = binding.id?.value;
  if (!canonicalId || !uopid) return null;
  return {
    canonicalId,
    name: binding.label?.value || uopid,
    uopid,
    locationCode: binding.locationCode?.value || null,
    type: binding.type?.value || null,
    countryCode: binding.inCountry?.value
      ? localName(binding.inCountry.value)
      : null,
  };
};

export const toOperationalPointSearchResults = (
  bindings: SparqlBinding[],
): OperationalPointSearchResult[] =>
  bindings
    .map(toOperationalPointSearchResult)
    .filter(
      (result): result is OperationalPointSearchResult => result !== null,
    );
