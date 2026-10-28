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

Added for the ERA RINF frontend, 2026-10-28. */

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { buildOperationalPointsQuery } from "../api/operationalPointsQuery";
import { BoundingBox, todayIsoDate } from "../api/queryParts";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  OperationalPoint,
  toOperationalPoints,
} from "../models/OperationalPoint";
import { MAP_FEATURES_LIMIT, RinfLoadStatus } from "./loadStatus";
import {
  readShowPreference,
  SHOW_OPERATIONAL_POINTS_KEY,
  writeShowPreference,
} from "./preferences";

export interface OperationalPointsState {
  show: boolean;
  items: OperationalPoint[];
  /** True when the last load hit MAP_FEATURES_LIMIT, so some OPs are missing. */
  truncated: boolean;
  status: RinfLoadStatus;
  selectedUri: string | null;
}

const initialState: OperationalPointsState = {
  show: readShowPreference(SHOW_OPERATIONAL_POINTS_KEY),
  items: [],
  truncated: false,
  status: "idle",
  selectedUri: null,
};

export interface FetchInBoxArgs {
  endpoint: string;
  box: BoundingBox;
  /** YYYY-MM-DD; defaults to today, so the map shows what is in force now. */
  validOn?: string;
}

export const fetchOperationalPointsInBox = createAsyncThunk<
  OperationalPoint[],
  FetchInBoxArgs
>(
  "rinf/fetchOperationalPointsInBox",
  async ({ endpoint, box, validOn = todayIsoDate() }, { signal }) => {
    const query = buildOperationalPointsQuery(box, MAP_FEATURES_LIMIT, validOn);
    return toOperationalPoints(await runSparqlSelect(endpoint, query, signal));
  },
);

const operationalPointsSlice = createSlice({
  name: "rinfOperationalPoints",
  initialState,
  reducers: {
    setShowOperationalPoints(state, action: PayloadAction<boolean>) {
      state.show = action.payload;
      writeShowPreference(SHOW_OPERATIONAL_POINTS_KEY, action.payload);
      if (!action.payload) state.selectedUri = null;
    },
    clearOperationalPoints(state) {
      state.items = [];
      state.truncated = false;
      state.status = "idle";
      state.selectedUri = null;
    },
    selectOperationalPoint(state, action: PayloadAction<string | null>) {
      state.selectedUri = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperationalPointsInBox.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOperationalPointsInBox.fulfilled, (state, action) => {
        state.items = action.payload;
        state.truncated = action.payload.length >= MAP_FEATURES_LIMIT;
        state.status = "loaded";
      })
      .addCase(fetchOperationalPointsInBox.rejected, (state, action) => {
        // A newer map move cancelled this request; its own result will follow.
        if (action.meta.aborted) return;
        state.status = "failed";
      });
  },
});

export const {
  setShowOperationalPoints,
  clearOperationalPoints,
  selectOperationalPoint,
} = operationalPointsSlice.actions;

export const operationalPointsReducer = operationalPointsSlice.reducer;
