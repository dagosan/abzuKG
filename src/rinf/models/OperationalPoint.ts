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

/** What the map needs to draw and open one OP; the panel loads the rest. */
export interface OperationalPoint {
  /** URI of the version valid on the chosen date. */
  uri: string;
  /**
   * Stable id across versions, used in the page URL. Usually the UOPID,
   * but not always (771 OPs on 2026-10-28), so it is read, not assumed.
   */
  canonicalId: string;
  uopid: string;
  name: string;
  lat: number;
  lng: number;
}

/** Maps one SPARQL row to an OP; null when the row lacks an id or a usable position. */
export const toOperationalPoint = (
  binding: SparqlBinding,
): OperationalPoint | null => {
  const uri = binding.op?.value;
  const uopid = binding.id?.value;
  const canonicalId = canonicalIdFromUri(
    "operationalPoint",
    binding.canonicalUri?.value ?? "",
  );
  const lat = Number.parseFloat(binding.latitude?.value ?? "");
  const lng = Number.parseFloat(binding.longitude?.value ?? "");
  if (!uri || !uopid || !canonicalId) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    uri,
    canonicalId,
    uopid,
    name: binding.label?.value || uopid,
    lat,
    lng,
  };
};

export const toOperationalPoints = (
  bindings: SparqlBinding[],
): OperationalPoint[] =>
  bindings
    .map(toOperationalPoint)
    .filter((point): point is OperationalPoint => point !== null);
