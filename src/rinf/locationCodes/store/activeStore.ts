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

Added for the ERA RINF frontend, 2026-10-29; Tiamat backend added the same day. */

import { getFetchedConfig } from "../../../config/fetchConfig";
import { browserStore } from "./browserStore";
import type { LocationCodeStore } from "./LocationCodeStore";
import { createTiamatStore } from "./tiamatStore";

let tiamatStore: { url: string; store: LocationCodeStore } | null = null;

/**
 * Tiamat when bootstrap.json sets `locationCodesApiUrl`, otherwise this
 * browser. Read on each call, because the config loads after this module.
 */
export const currentLocationCodeStore = (): LocationCodeStore => {
  const url = getFetchedConfig()?.locationCodesApiUrl;
  if (!url) return browserStore;
  if (tiamatStore?.url !== url)
    tiamatStore = { url, store: createTiamatStore(url) };
  return tiamatStore.store;
};

/** Where the data lives, for the UI: "tiamat" or "browser". */
export const locationCodeStoreKind = (): "tiamat" | "browser" =>
  getFetchedConfig()?.locationCodesApiUrl ? "tiamat" : "browser";

/** The store in use, chosen per call (see currentLocationCodeStore). */
export const locationCodeStore: LocationCodeStore = {
  loadRequests: () => currentLocationCodeStore().loadRequests(),
  saveRequest: (request) => currentLocationCodeStore().saveRequest(request),
  saveRequestWithCodes: (request, codes) =>
    currentLocationCodeStore().saveRequestWithCodes(request, codes),
  loadCodes: () => currentLocationCodeStore().loadCodes(),
  saveCodes: (codes) => currentLocationCodeStore().saveCodes(codes),
  nextReferenceSequence: (year) =>
    currentLocationCodeStore().nextReferenceSequence(year),
  exportSnapshot: () => currentLocationCodeStore().exportSnapshot(),
  importSnapshot: (snapshot) =>
    currentLocationCodeStore().importSnapshot(snapshot),
};

const RANDOM_ID_RADIX = 36;
const RANDOM_ID_START = 2;

/**
 * A unique id. crypto.randomUUID only exists in secure contexts, so an app
 * served over plain http (e.g. on a NAS) falls back to time plus randomness.
 */
export const newId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // Not a secure context.
    }
  }
  return `${Date.now().toString(RANDOM_ID_RADIX)}-${Math.random()
    .toString(RANDOM_ID_RADIX)
    .slice(RANDOM_ID_START)}`;
};
