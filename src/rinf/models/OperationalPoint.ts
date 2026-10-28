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

export interface OperationalPoint {
  /** The OP's URI in the knowledge graph. */
  uri: string;
  uopid: string;
  name: string;
  /** Code from the op-types list, e.g. "10" for station; null if absent. */
  typeCode: string | null;
  /** ISO 3166 alpha-3 code from the EU country authority list, e.g. "BEL". */
  countryCode: string | null;
  lat: number;
  lng: number;
}

const lastPathSegment = (uri: string | undefined): string | null => {
  if (!uri) return null;
  const segment = uri.split("/").pop();
  return segment || null;
};

/** Maps one SPARQL row to an OP; null when the row lacks an id or a usable position. */
export const toOperationalPoint = (
  binding: SparqlBinding,
): OperationalPoint | null => {
  const uri = binding.op?.value;
  const uopid = binding.id?.value;
  const lat = Number.parseFloat(binding.latitude?.value ?? "");
  const lng = Number.parseFloat(binding.longitude?.value ?? "");
  if (!uri || !uopid) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    uri,
    uopid,
    name: binding.label?.value || uopid,
    typeCode: lastPathSegment(binding.opType?.value),
    countryCode: lastPathSegment(binding.inCountry?.value),
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
