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

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../../store/store";
import {
  Country,
  MasterData,
  SubsidiaryType,
  withCountry,
  withSubsidiaryType,
} from "../model/masterData";
import {
  currentMasterData,
  setCurrentMasterData,
} from "../model/masterDataRegistry";
import { locationCodeStore } from "../store/activeStore";

/**
 * Reads the countries and subsidiary types from the store and hands them to
 * the rules (model/masterDataRegistry.ts). Public, like the register.
 */
export const loadMasterData = createAsyncThunk<
  MasterData,
  void,
  { state: RootState }
>(
  "rinf/locationCodes/loadMasterData",
  async () => {
    const masterData = await locationCodeStore.loadMasterData();
    setCurrentMasterData(masterData);
    return masterData;
  },
  {
    // The page, the form and the map may all ask; it is fetched once.
    condition: (_, { getState }) =>
      getState().rinf.locationCodes.masterDataLoadStatus !== "loading",
  },
);

/** Saves a country; the rules read the saved one from then on. */
export const saveCountry = createAsyncThunk<Country, Country>(
  "rinf/locationCodes/saveCountry",
  async (country) => {
    const saved = await locationCodeStore.saveCountry(country);
    setCurrentMasterData(withCountry(currentMasterData(), saved));
    return saved;
  },
);

export const saveSubsidiaryType = createAsyncThunk<
  SubsidiaryType,
  SubsidiaryType
>("rinf/locationCodes/saveSubsidiaryType", async (type) => {
  const saved = await locationCodeStore.saveSubsidiaryType(type);
  setCurrentMasterData(withSubsidiaryType(currentMasterData(), saved));
  return saved;
});
