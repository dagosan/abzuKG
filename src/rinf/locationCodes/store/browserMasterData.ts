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

import {
  Country,
  MasterData,
  SubsidiaryType,
  withCountry,
  withSubsidiaryType,
} from "../model/masterData";
import { defaultMasterData } from "../model/masterDataRegistry";

const STORAGE_KEY = "abzuKG.locationCodes.masterData.v1";

/** Kept in memory when browser storage is missing, full or blocked. */
let memoryCopy: MasterData | null = null;

/** This browser's master data; the built-in lists until something is saved. */
export const readMasterData = (): MasterData => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultMasterData(), ...JSON.parse(stored) };
  } catch {
    // Fall back to the in-memory copy below.
  }
  return memoryCopy ?? defaultMasterData();
};

const writeMasterData = (masterData: MasterData): void => {
  memoryCopy = masterData;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(masterData));
  } catch {
    // Kept in memory only.
  }
};

/** Another country with the same UIC code: the register refuses it too. */
export const DUPLICATE_UIC_ERROR = "rinf_lc_md_error_uic_duplicate";

export const saveCountryInBrowser = (country: Country): Country => {
  const masterData = readMasterData();
  const isTaken = masterData.countries.some(
    (other) =>
      other.isoCode !== country.isoCode && other.uicCode === country.uicCode,
  );
  if (country.uicCode !== null && isTaken) throw new Error(DUPLICATE_UIC_ERROR);
  writeMasterData(withCountry(masterData, country));
  return country;
};

export const saveSubsidiaryTypeInBrowser = (
  type: SubsidiaryType,
): SubsidiaryType => {
  writeMasterData(withSubsidiaryType(readMasterData(), type));
  return type;
};
