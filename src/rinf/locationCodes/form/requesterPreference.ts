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

import type { Requester } from "../model/LocationCodeRequest";

const REQUESTER_KEY = "abzuKG.locationCodes.requester";

/** The requester details last submitted in this browser, to save retyping. */
export const readRequester = (): Partial<Requester> => {
  try {
    return JSON.parse(window.localStorage.getItem(REQUESTER_KEY) ?? "{}");
  } catch {
    return {};
  }
};

export const writeRequester = (requester: Requester): void => {
  try {
    window.localStorage.setItem(REQUESTER_KEY, JSON.stringify(requester));
  } catch {
    // Not remembered; nothing else depends on it.
  }
};
