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
import { addProfileCases } from "./parameterProfileCases";
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
  /** Address of the report, so the tab and a details panel can lead back to it. */
  searchPath: string | null;
  /** The results are drawn on the map, the rest faded ("Show on map"). */
  showOnMap: boolean;
  /** The map should zoom to the results once, then clears this. */
  fitPending: boolean;
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
  showOnMap: false,
  fitPending: false,
};

const parameterSearchSlice = createSlice({
  name: "rinfParameterSearch",
  initialState,
  reducers: {
    setSearchPath(state, action: PayloadAction<string>) {
      state.searchPath = action.payload;
    },
    showResultsOnMap(state) {
      state.showOnMap = true;
      state.fitPending = true;
    },
    hideResultsOnMap(state) {
      state.showOnMap = false;
      state.fitPending = false;
    },
    mapFittedToResults(state) {
      state.fitPending = false;
    },
  },
  extraReducers: (builder) => {
    addProfileCases(builder);
    builder
      .addCase(runParameterSearch.pending, (state, action) => {
        state.resultsKey = criteriaKey(action.meta.arg.criteria);
        state.resultsStatus = "loading";
        state.places = [];
        state.truncated = false;
        // New results are shown on the map only when asked for.
        state.showOnMap = false;
        state.fitPending = false;
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

export const {
  setSearchPath,
  showResultsOnMap,
  hideResultsOnMap,
  mapFittedToResults,
} = parameterSearchSlice.actions;

export const parameterSearchReducer = parameterSearchSlice.reducer;
