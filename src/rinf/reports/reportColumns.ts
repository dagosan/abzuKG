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

import type { DetailsKind } from "../detailsKinds";
import type { PlaceMatch } from "../models/parameterMatches";

/**
 * Report columns. The ids double as text keys: Abzu's column selector labels
 * each option with `report_columnNames_<id>`.
 */
export type ReportColumnId =
  | "rinfName"
  | "rinfKind"
  | "rinfId"
  | "rinfLine"
  | "rinfCountry"
  | "rinfIm"
  | "rinfMatches";

export const REPORT_COLUMN_IDS: ReportColumnId[] = [
  "rinfName",
  "rinfKind",
  "rinfId",
  "rinfLine",
  "rinfCountry",
  "rinfIm",
  "rinfMatches",
];

export const columnLabelId = (column: ReportColumnId): string =>
  `report_columnNames_${column}`;

/** Readable names the cells need, from the text keys and the vocabulary. */
export interface CellContext {
  kindLabel: (kind: DetailsKind) => string;
  elementTypeLabel: (typeUri: string) => string;
}

/** What one cell shows, and what the CSV export writes for it. */
export const cellValue = (
  column: ReportColumnId,
  place: PlaceMatch,
  context: CellContext,
): string => {
  switch (column) {
    case "rinfName":
      return place.name;
    case "rinfKind":
      return context.kindLabel(place.kind);
    case "rinfId":
      return place.canonicalId;
    case "rinfLine":
      return place.lineNumber ?? "";
    case "rinfCountry":
      return place.countryCode;
    case "rinfIm":
      return place.imCode;
    case "rinfMatches":
      return place.elementTypeUri
        ? `${place.matches} × ${context.elementTypeLabel(place.elementTypeUri)}`
        : String(place.matches);
  }
};

/** By name, numbers in names in numeric order ("Line 2" before "Line 10"). */
export const sortPlaces = (places: PlaceMatch[]): PlaceMatch[] =>
  [...places].sort((first, second) =>
    first.name.localeCompare(second.name, "en", { numeric: true }),
  );
