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

Added for the ERA Location Code Manager, 2026-11-10. */

import { DEFAULT_COUNTRIES } from "./defaultCountries";
import { DEFAULT_SUBSIDIARY_TYPES } from "./defaultSubsidiaryTypes";
import type { MasterData } from "./masterData";

export const defaultMasterData = (): MasterData => ({
  countries: DEFAULT_COUNTRIES,
  subsidiaryTypes: DEFAULT_SUBSIDIARY_TYPES,
});

let current: MasterData = defaultMasterData();

/**
 * The master data the rules read (model/countries.ts, subsidiaryTypes.ts):
 * the store's once loaded (state/masterDataThunks.ts), the built-in lists
 * until then. Kept here, outside Redux, because the checks and the workflow
 * are plain functions that are also run by the browser store.
 */
export const currentMasterData = (): MasterData => current;

export const setCurrentMasterData = (masterData: MasterData): void => {
  current = masterData;
};
