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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CarrierType } from "../models/parameterAttachments";
import { criteriaKey } from "../models/parameterCriteria";
import type { PlaceMatch } from "../models/parameterMatches";
import type { ValueInUse } from "../models/parameterValues";
import type { ScopeOptions } from "../models/scopeOptions";
import type { RinfLoadStatus } from "./loadStatus";
import {
  fetchCarrierTypes,
  fetchScopeOptions,
  fetchValuesInUse,
} from "./parameterProfileThunks";
import {
  PLACE_MATCHES_LIMIT,
  runParameterSearch,
} from "./parameterSearchThunk";

export interface ParameterSearchState {
  scopeOptions: ScopeOptions | null;
  scopeStatus: RinfLoadStatus;
  /** Carrier types per parameter, kept for the session. */
  carriersByProperty: Record<string, CarrierType[]>;
  carriersStatus: RinfLoadStatus;
  values: ValueInUse[];
  valuesStatus: RinfLoadStatus;
  /** The parameter the values are for, so another parameter's are never used. */
  valuesProperty: string | null;
  /** Which search the results are for; null when there are none to show. */
  resultsKey: string | null;
  resultsStatus: RinfLoadStatus;
  places: PlaceMatch[];
  truncated: boolean;
  /** Address of the search, so a details panel can lead back to it. */
  searchPath: string | null;
}

const initialState: ParameterSearchState = {
  scopeOptions: null,
  scopeStatus: "idle",
  carriersByProperty: {},
  carriersStatus: "idle",
  values: [],
  valuesStatus: "idle",
  valuesProperty: null,
  resultsKey: null,
  resultsStatus: "idle",
  places: [],
  truncated: false,
  searchPath: null,
};

const parameterSearchSlice = createSlice({
  name: "rinfParameterSearch",
  initialState,
  reducers: {
    setSearchPath(state, action: PayloadAction<string>) {
      state.searchPath = action.payload;
    },
    /** Ends the search: results and their map highlight go away. */
    clearParameterSearch(state) {
      state.resultsKey = null;
      state.resultsStatus = "idle";
      state.places = [];
      state.truncated = false;
      state.searchPath = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScopeOptions.pending, (state) => {
        state.scopeStatus = "loading";
      })
      .addCase(fetchScopeOptions.fulfilled, (state, action) => {
        state.scopeOptions = action.payload;
        state.scopeStatus = "loaded";
      })
      .addCase(fetchScopeOptions.rejected, (state) => {
        state.scopeStatus = "failed";
      })
      .addCase(fetchCarrierTypes.pending, (state) => {
        state.carriersStatus = "loading";
      })
      .addCase(fetchCarrierTypes.fulfilled, (state, action) => {
        state.carriersByProperty[action.meta.arg.property] = action.payload;
        state.carriersStatus = "loaded";
      })
      .addCase(fetchCarrierTypes.rejected, (state, action) => {
        if (!action.meta.aborted) state.carriersStatus = "failed";
      })
      .addCase(fetchValuesInUse.pending, (state, action) => {
        state.valuesStatus = "loading";
        state.values = [];
        state.valuesProperty = action.meta.arg.property;
      })
      .addCase(fetchValuesInUse.fulfilled, (state, action) => {
        if (action.meta.arg.property !== state.valuesProperty) return;
        state.values = action.payload;
        state.valuesStatus = "loaded";
      })
      .addCase(fetchValuesInUse.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (action.meta.arg.property !== state.valuesProperty) return;
        state.valuesStatus = "failed";
      })
      .addCase(runParameterSearch.pending, (state, action) => {
        state.resultsKey = criteriaKey(action.meta.arg.criteria);
        state.resultsStatus = "loading";
        state.places = [];
        state.truncated = false;
      })
      .addCase(runParameterSearch.fulfilled, (state, action) => {
        if (criteriaKey(action.meta.arg.criteria) !== state.resultsKey) return;
        state.places = action.payload;
        state.truncated = action.payload.length >= PLACE_MATCHES_LIMIT;
        state.resultsStatus = "loaded";
      })
      .addCase(runParameterSearch.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (criteriaKey(action.meta.arg.criteria) !== state.resultsKey) return;
        state.resultsStatus = "failed";
      });
  },
});

export const { setSearchPath, clearParameterSearch } =
  parameterSearchSlice.actions;

export const parameterSearchReducer = parameterSearchSlice.reducer;
