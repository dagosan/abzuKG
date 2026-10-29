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
import type {
  LocationCodeSnapshot,
  LocationCodeStore,
} from "./LocationCodeStore";

const STORAGE_KEY = "abzuKG.locationCodes.v1";

const emptySnapshot = (): LocationCodeSnapshot => ({
  requests: [],
  codes: [],
  sequences: {},
});

/**
 * Browser storage can be missing, full or blocked (private windows, cleared
 * site data); the store then keeps working in memory for the session.
 */
let memoryCopy: LocationCodeSnapshot | null = null;

export const readSnapshot = (): LocationCodeSnapshot => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...emptySnapshot(), ...JSON.parse(stored) };
  } catch {
    // Fall back to the in-memory copy below.
  }
  return memoryCopy ?? emptySnapshot();
};

export const writeSnapshot = (snapshot: LocationCodeSnapshot): void => {
  memoryCopy = snapshot;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Kept in memory only.
  }
};

const upsert = <Item>(
  items: Item[],
  replacements: Item[],
  keyOf: (item: Item) => string,
): Item[] => {
  const replacementKeys = new Set(replacements.map(keyOf));
  return [
    ...items.filter((item) => !replacementKeys.has(keyOf(item))),
    ...replacements,
  ];
};

const requestKey = (request: LocationCodeRequest) => request.id;
const codeKey = (code: RegisteredCode) => code.key;

/** The store kept in this browser's local storage. */
export const browserStore: LocationCodeStore = {
  loadRequests: async () => readSnapshot().requests,
  saveRequest: async (request) => {
    const snapshot = readSnapshot();
    writeSnapshot({
      ...snapshot,
      requests: upsert(snapshot.requests, [request], requestKey),
    });
  },
  saveRequestWithCodes: async (request, codes) => {
    const snapshot = readSnapshot();
    writeSnapshot({
      ...snapshot,
      requests: upsert(snapshot.requests, [request], requestKey),
      codes: upsert(snapshot.codes, codes, codeKey),
    });
  },
  loadCodes: async () => readSnapshot().codes,
  saveCodes: async (codes) => {
    const snapshot = readSnapshot();
    writeSnapshot({
      ...snapshot,
      codes: upsert(snapshot.codes, codes, codeKey),
    });
  },
  nextReferenceSequence: async (year) => {
    const snapshot = readSnapshot();
    const next = (snapshot.sequences[String(year)] ?? 0) + 1;
    writeSnapshot({
      ...snapshot,
      sequences: { ...snapshot.sequences, [String(year)]: next },
    });
    return next;
  },
  exportSnapshot: async () => readSnapshot(),
  /** Replaces what this browser holds. */
  importSnapshot: async (snapshot) => writeSnapshot(snapshot),
};
