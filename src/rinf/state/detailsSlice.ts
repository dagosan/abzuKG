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

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { buildDetailsQuery } from "../api/detailsQuery";
import { todayIsoDate } from "../api/queryParts";
import { runSparqlSelect } from "../api/sparqlClient";
import { DetailsKind, DETAILS_KINDS } from "../detailsKinds";
import { DetailsNode, toDetailsTrees } from "../models/detailsTree";
import type { RinfLoadStatus } from "./loadStatus";

export interface DetailsState {
  kind: DetailsKind | null;
  /** Canonical id of the element being shown, e.g. "BELGB". */
  canonicalId: string | null;
  status: RinfLoadStatus | "notFound";
  /** One per declaration; two for a border point declared by two IMs. */
  roots: DetailsNode[];
}

const initialState: DetailsState = {
  kind: null,
  canonicalId: null,
  status: "idle",
  roots: [],
};

interface FetchDetailsArgs {
  endpoint: string;
  kind: DetailsKind;
  canonicalId: string;
  validOn?: string;
}

export const fetchDetails = createAsyncThunk<DetailsNode[], FetchDetailsArgs>(
  "rinf/fetchDetails",
  async (
    { endpoint, kind, canonicalId, validOn = todayIsoDate() },
    { signal },
  ) => {
    const { canonicalPrefix, hiddenProperties } = DETAILS_KINDS[kind];
    const query = buildDetailsQuery(canonicalPrefix, canonicalId, validOn);
    return toDetailsTrees(
      await runSparqlSelect(endpoint, query, signal),
      hiddenProperties,
    );
  },
);

const isCurrentRequest = (
  state: DetailsState,
  { kind, canonicalId }: FetchDetailsArgs,
): boolean => state.kind === kind && state.canonicalId === canonicalId;

const detailsSlice = createSlice({
  name: "rinfDetails",
  initialState,
  reducers: {
    closeDetails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDetails.pending, (state, action) => {
        state.kind = action.meta.arg.kind;
        state.canonicalId = action.meta.arg.canonicalId;
        state.status = "loading";
        state.roots = [];
      })
      .addCase(fetchDetails.fulfilled, (state, action) => {
        if (!isCurrentRequest(state, action.meta.arg)) return;
        state.roots = action.payload;
        state.status = action.payload.length > 0 ? "loaded" : "notFound";
      })
      .addCase(fetchDetails.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (!isCurrentRequest(state, action.meta.arg)) return;
        state.status = "failed";
      });
  },
});

export const { closeDetails } = detailsSlice.actions;

export const detailsReducer = detailsSlice.reducer;
