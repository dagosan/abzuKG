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

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";

/**
 * Where requests and registered codes are kept. The first implementation
 * keeps them in the browser (browserStore.ts); a CAS or Tiamat backend can
 * replace it by implementing the same contract, and nothing else changes.
 */
export interface LocationCodeStore {
  loadRequests(): Promise<LocationCodeRequest[]>;
  /** Creates or replaces the request with the same id. */
  saveRequest(request: LocationCodeRequest): Promise<void>;
  loadCodes(): Promise<RegisteredCode[]>;
  /** Creates or replaces each code with the same key. */
  saveCodes(codes: RegisteredCode[]): Promise<void>;
  /** Next number for request references in `year`, starting at 1. */
  nextReferenceSequence(year: number): Promise<number>;
}

/** Everything a store holds, for backup and restore. */
export interface LocationCodeSnapshot {
  requests: LocationCodeRequest[];
  codes: RegisteredCode[];
  sequences: Record<string, number>;
}
