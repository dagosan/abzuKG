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

Added for the ERA RINF frontend, 2026-10-29; Tiamat backend methods added the same day. */

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";

/**
 * Where requests and registered codes are kept: in the browser
 * (browserStore.ts), or in Tiamat (tiamatStore.ts) when bootstrap.json sets
 * `locationCodesApiUrl`. activeStore.ts picks one.
 */
export interface LocationCodeStore {
  loadRequests(): Promise<LocationCodeRequest[]>;
  /** Creates or replaces the request with the same id. */
  saveRequest(request: LocationCodeRequest): Promise<void>;
  /** A step that changes the register too: both are saved, or neither. */
  saveRequestWithCodes(
    request: LocationCodeRequest,
    codes: RegisteredCode[],
  ): Promise<void>;
  loadCodes(): Promise<RegisteredCode[]>;
  /** Creates or replaces each code with the same key. */
  saveCodes(codes: RegisteredCode[]): Promise<void>;
  /** Next number for request references in `year`, starting at 1. */
  nextReferenceSequence(year: number): Promise<number>;
  /** Everything, for the backup file. */
  exportSnapshot(): Promise<LocationCodeSnapshot>;
  /** Loads a backup file. */
  importSnapshot(snapshot: LocationCodeSnapshot): Promise<void>;
}

/** Everything a store holds, for backup and restore. */
export interface LocationCodeSnapshot {
  requests: LocationCodeRequest[];
  codes: RegisteredCode[];
  sequences: Record<string, number>;
}
