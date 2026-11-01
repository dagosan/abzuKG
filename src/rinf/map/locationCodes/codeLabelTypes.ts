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

Added for the ERA RINF frontend, 2026-11-01. */

import type { DetailsKind } from "../../detailsKinds";

/**
 * Where the map knows a code from: RINF (the knowledge graph), the register,
 * or both. The label style tells them apart.
 */
export type CodeSource = "rinf" | "register" | "registerAndRinf";

export const CODE_SOURCES: CodeSource[] = [
  "rinf",
  "registerAndRinf",
  "register",
];

export interface CodeLabelChip {
  /** "BE00438", or "BE00438/0000000001" for a subsidiary code. */
  text: string;
  source: CodeSource;
}

/** The codes shown next to one OP or SoL. */
export interface CodeLabel {
  kind: DetailsKind;
  canonicalId: string;
  lat: number;
  lng: number;
  chips: CodeLabelChip[];
}
