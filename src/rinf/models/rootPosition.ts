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
import { parseWktLines } from "./wkt";

/** The middle of a line, as [lat, lng]: halfway between its two ends. */
const middleOfShape = (wkt: string): [number, number] | null => {
  const [firstLine] = parseWktLines(wkt);
  if (!firstLine) return null;
  const [startLng, startLat] = firstLine[0];
  const [endLng, endLat] = firstLine[firstLine.length - 1];
  return [(startLat + endLat) / 2, (startLng + endLng) / 2];
};

/**
 * Position carried by one details row, as [lat, lng]: an OP's net reference
 * gives coordinates, a SoL's gives its shape. Null for any other row.
 */
export const positionFromBinding = ({
  oLat,
  oLng,
  oWkt,
}: SparqlBinding): [number, number] | null => {
  const lat = Number.parseFloat(oLat?.value ?? "");
  const lng = Number.parseFloat(oLng?.value ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return oWkt?.value ? middleOfShape(oWkt.value) : null;
};
