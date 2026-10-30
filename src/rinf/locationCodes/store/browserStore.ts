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

Added for the ERA RINF frontend, 2026-10-29; Tiamat backend methods added the same day.
Modified 2026-10-30: takes the workflow steps itself (browserWorkflow.ts). */

import { createRequest } from "../workflow/createRequest";
import { takeStepInBrowser } from "./browserWorkflow";
import type {
  LocationCodeSnapshot,
  LocationCodeStore,
} from "./LocationCodeStore";
import { newId } from "./newId";

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

/** The store kept in this browser's local storage; steps are taken here too. */
export const browserStore: LocationCodeStore = {
  loadRequests: async () => readSnapshot().requests,
  loadCodes: async () => readSnapshot().codes,
  submitRequest: async (data, actor) => {
    const request = createRequest(
      newId(),
      data,
      actor,
      new Date().toISOString(),
    );
    const snapshot = readSnapshot();
    writeSnapshot({ ...snapshot, requests: [...snapshot.requests, request] });
    return request;
  },
  takeStep: async (step) => {
    const { result, snapshot } = await takeStepInBrowser(readSnapshot(), step);
    writeSnapshot(snapshot);
    return result;
  },
  exportSnapshot: async () => readSnapshot(),
  /** Replaces what this browser holds. */
  importSnapshot: async (snapshot) => writeSnapshot(snapshot),
};
