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

import { ERA_NAMESPACE } from "../api/queryParts";
import type { SparqlBinding } from "../api/sparqlClient";
import { canonicalIdFromUri, DetailsKind } from "../detailsKinds";
import { localName, sectionOfLineName, stripValidity } from "./labels";
import { LinePositions, parseWktLines } from "./wkt";

/** A section of line or OP holding at least one element that matches. */
export interface PlaceMatch {
  kind: DetailsKind;
  canonicalId: string;
  name: string;
  countryCode: string;
  /** National line number of a section of line, e.g. "0504"; null for OPs. */
  lineNumber: string | null;
  /** Organisation code of the IM whose dataset holds the match. */
  imCode: string;
  /** How many matching elements it holds, and of which type (e.g. RunningTrack). */
  matches: number;
  elementTypeUri: string | null;
  /** Where the map draws it: a SoL's lines, or an OP's [lng, lat]. */
  lines: LinePositions[];
  lngLat: [number, number] | null;
}

const SECTION_OF_LINE_TYPE = `${ERA_NAMESPACE}SectionOfLine`;

const toLngLat = (binding: SparqlBinding): [number, number] | null => {
  const lat = Number(binding.latitude?.value);
  const lng = Number(binding.longitude?.value);
  return binding.latitude && Number.isFinite(lat) && Number.isFinite(lng)
    ? [lng, lat]
    : null;
};

export const toPlaceMatch = (binding: SparqlBinding): PlaceMatch | null => {
  const kind: DetailsKind =
    binding.placeType?.value === SECTION_OF_LINE_TYPE
      ? "sectionOfLine"
      : "operationalPoint";
  const canonicalId = canonicalIdFromUri(kind, binding.canonical?.value ?? "");
  if (!canonicalId) return null;
  const label = binding.label?.value ?? canonicalId;
  return {
    kind,
    canonicalId,
    name:
      kind === "sectionOfLine"
        ? sectionOfLineName(label)
        : stripValidity(label),
    countryCode: localName(binding.inCountry?.value ?? ""),
    lineNumber: binding.line?.value || null,
    imCode: localName(binding.imDataset?.value ?? ""),
    matches: Number.parseInt(binding.matches?.value ?? "0", 10),
    elementTypeUri: binding.elementType?.value || null,
    lines: binding.wkt?.value ? parseWktLines(binding.wkt.value) : [],
    lngLat: toLngLat(binding),
  };
};

export const toPlaceMatches = (bindings: SparqlBinding[]): PlaceMatch[] =>
  bindings
    .map(toPlaceMatch)
    .filter((match): match is PlaceMatch => match !== null);

/** Canonical ids of the matching places of one kind, for the map to highlight. */
export const matchedIds = (places: PlaceMatch[], kind: DetailsKind): string[] =>
  places
    .filter((place) => place.kind === kind)
    .map((place) => place.canonicalId);
