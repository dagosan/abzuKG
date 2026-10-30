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

Added for the ERA RINF frontend, 2026-10-29; Tiamat backend added the same day.
Modified 2026-10-30: stores take workflow steps; newId moved to newId.ts. */

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
  loadCodes: () => currentLocationCodeStore().loadCodes(),
  submitRequest: (data, actor) =>
    currentLocationCodeStore().submitRequest(data, actor),
  takeStep: (step) => currentLocationCodeStore().takeStep(step),
  exportSnapshot: () => currentLocationCodeStore().exportSnapshot(),
  importSnapshot: (snapshot) =>
    currentLocationCodeStore().importSnapshot(snapshot),
};
