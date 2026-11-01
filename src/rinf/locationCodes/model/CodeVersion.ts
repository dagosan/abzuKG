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

Added for the ERA RINF frontend, 2026-11-02. */

import type { CodeType } from "./codeTypes";
import type { RinfLink } from "./LocationCodeRequest";

/** What a request did to a version: assigned or amended opens one; amended or closed ends one. */
export type CodeChange = "assigned" | "amended" | "closed";

/** The request that opened or ended a version. */
export interface VersionChange {
  at: string;
  requestId: string;
  reference: string | null;
  change: CodeChange;
}

/**
 * One version of a location code: one row of CRD's location table, with the
 * same columns (Country_ISO_code → countryIsoCode, …), plus what the workflow
 * keeps (the RINF element, the requests behind the version, SLC fields).
 * Changing a name, IM or use ends the current version and starts the next.
 */
export interface CodeVersion {
  /** The PLC, or "<PLC>/<SLC>": the same on every version of a code. */
  key: string;
  /** 1 for the first version, then 2, 3… */
  version: number;
  codeType: CodeType;
  /** "BE00438", or the SLC value. CRD writes the PLC as country + number (BE, 438). */
  code: string;
  parentPrimaryCode: string | null;
  subsidiaryTypeCode: string;
  countryIsoCode: string;
  /** First day valid; null for a code the register knows only from the KG. */
  startValidity: string | null;
  /** Last day valid, as in CRD; null while open. */
  endValidity: string | null;
  responsibleImCode: string;
  locationName: string;
  locationNameAscii: string;
  nutsCode: string;
  containerHandlingFlag: boolean;
  handoverPointFlag: boolean;
  freightPossibleFlag: boolean;
  freightStartValidity: string | null;
  freightEndValidity: string | null;
  passengerPossibleFlag: boolean;
  passengerStartValidity: string | null;
  passengerEndValidity: string | null;
  latitude: number | null;
  longitude: number | null;
  freeText: string;
  /** When the version was recorded, and last changed (ISO instants). */
  addDate: string;
  modDate: string;
  rinfLink: RinfLink | null;
  openedBy: VersionChange | null;
  endedBy: VersionChange | null;
}
