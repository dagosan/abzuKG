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

import type { CodeType } from "./codeTypes";
import type { RinfLink } from "./LocationCodeRequest";

export type CodeChange = "assigned" | "amended" | "closed";

export interface CodeHistoryEntry {
  at: string;
  requestId: string;
  reference: string | null;
  change: CodeChange;
}

/**
 * A code recorded and published by this workflow (procedure 8.8). Codes are
 * never deleted or reused: a deactivation sets `closedFrom`.
 */
export interface RegisteredCode {
  /** The PLC, or "<PLC>/<SLC>" for a subsidiary code. */
  key: string;
  codeType: CodeType;
  code: string;
  parentPrimaryCode: string | null;
  country: string;
  name: string;
  imOrganisationCode: string;
  subsidiaryTypeCode: string;
  rinfLink: RinfLink | null;
  validFrom: string;
  closedFrom: string | null;
  history: CodeHistoryEntry[];
}

/** Active on `isoDate` (YYYY-MM-DD): not closed, or closed only later. */
export const isActiveOn = (code: RegisteredCode, isoDate: string): boolean =>
  code.closedFrom === null || code.closedFrom > isoDate;
