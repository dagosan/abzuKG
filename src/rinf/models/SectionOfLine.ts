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

import type { SparqlBinding } from "../api/sparqlClient";
import { canonicalIdFromUri } from "../detailsKinds";
import { sectionOfLineName } from "./labels";
import { LinePositions, parseWktLines } from "./wkt";

/** What the map needs to draw and open one SoL. */
export interface SectionOfLineSummary {
  /** URI of the version valid on the chosen date. */
  uri: string;
  /** Stable id across versions, e.g. "1440_BELGB_BECAD"; used in the page URL. */
  canonicalId: string;
  name: string;
  lines: LinePositions[];
}

export const toSectionOfLineSummary = (
  binding: SparqlBinding,
): SectionOfLineSummary | null => {
  const uri = binding.sol?.value;
  const canonicalId = canonicalIdFromUri(
    "sectionOfLine",
    binding.canonicalUri?.value ?? "",
  );
  const lines = parseWktLines(binding.wkt?.value ?? "");
  if (!uri || !canonicalId || lines.length === 0) return null;
  return {
    uri,
    canonicalId,
    name: sectionOfLineName(binding.label?.value ?? canonicalId),
    lines,
  };
};

export const toSectionOfLineSummaries = (
  bindings: SparqlBinding[],
): SectionOfLineSummary[] =>
  bindings
    .map(toSectionOfLineSummary)
    .filter((summary): summary is SectionOfLineSummary => summary !== null);
