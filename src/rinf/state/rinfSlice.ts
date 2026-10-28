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
import {
  BoundingBox,
  buildOperationalPointsQuery,
  todayIsoDate,
} from "../api/operationalPointsQuery";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  OperationalPoint,
  toOperationalPoints,
} from "../models/OperationalPoint";
import {
  readShowOperationalPoints,
  writeShowOperationalPoints,
} from "./rinfPreferences";

/** Enough for a dense region at zoom 8; more would slow the browser down. */
export const OPERATIONAL_POINTS_LIMIT = 5000;

export type RinfLoadStatus = "idle" | "loading" | "failed";

export interface RinfState {
  showOperationalPoints: boolean;
  operationalPoints: OperationalPoint[];
  /** True when the last load hit OPERATIONAL_POINTS_LIMIT, so some OPs are missing. */
  operationalPointsTruncated: boolean;
  operationalPointsStatus: RinfLoadStatus;
  selectedOperationalPointUri: string | null;
}

const initialState: RinfState = {
  showOperationalPoints: readShowOperationalPoints(),
  operationalPoints: [],
  operationalPointsTruncated: false,
  operationalPointsStatus: "idle",
  selectedOperationalPointUri: null,
};

interface FetchOperationalPointsArgs {
  endpoint: string;
  box: BoundingBox;
  /** YYYY-MM-DD; defaults to today, so the map shows the OPs in force now. */
  validOn?: string;
}

export const fetchOperationalPointsInBox = createAsyncThunk<
  OperationalPoint[],
  FetchOperationalPointsArgs
>(
  "rinf/fetchOperationalPointsInBox",
  async ({ endpoint, box, validOn = todayIsoDate() }, { signal }) => {
    const query = buildOperationalPointsQuery(
      box,
      OPERATIONAL_POINTS_LIMIT,
      validOn,
    );
    const bindings = await runSparqlSelect(endpoint, query, signal);
    return toOperationalPoints(bindings);
  },
);

const rinfSlice = createSlice({
  name: "rinf",
  initialState,
  reducers: {
    setShowOperationalPoints(state, action: PayloadAction<boolean>) {
      state.showOperationalPoints = action.payload;
      writeShowOperationalPoints(action.payload);
      if (!action.payload) state.selectedOperationalPointUri = null;
    },
    clearOperationalPoints(state) {
      state.operationalPoints = [];
      state.operationalPointsTruncated = false;
      state.operationalPointsStatus = "idle";
      state.selectedOperationalPointUri = null;
    },
    selectOperationalPoint(state, action: PayloadAction<string | null>) {
      state.selectedOperationalPointUri = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperationalPointsInBox.pending, (state) => {
        state.operationalPointsStatus = "loading";
      })
      .addCase(fetchOperationalPointsInBox.fulfilled, (state, action) => {
        state.operationalPoints = action.payload;
        state.operationalPointsTruncated =
          action.payload.length >= OPERATIONAL_POINTS_LIMIT;
        state.operationalPointsStatus = "idle";
      })
      .addCase(fetchOperationalPointsInBox.rejected, (state, action) => {
        // A newer map move cancelled this request; its own result will follow.
        if (action.meta.aborted) return;
        state.operationalPointsStatus = "failed";
      });
  },
});

export const {
  setShowOperationalPoints,
  clearOperationalPoints,
  selectOperationalPoint,
} = rinfSlice.actions;

export default rinfSlice.reducer;
