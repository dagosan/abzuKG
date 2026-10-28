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
import { todayIsoDate } from "../api/queryParts";
import { buildSectionOfLineDetailsQuery } from "../api/sectionOfLineDetailsQuery";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  DetailsNode,
  toSectionOfLineDetails,
} from "../models/SectionOfLineDetails";
import type { RinfLoadStatus } from "./loadStatus";

export interface SectionOfLineDetailsState {
  /** Canonical id of the SoL being shown, e.g. "1440_BELGB_BECAD". */
  canonicalId: string | null;
  status: RinfLoadStatus | "notFound";
  details: DetailsNode | null;
}

const initialState: SectionOfLineDetailsState = {
  canonicalId: null,
  status: "idle",
  details: null,
};

interface FetchDetailsArgs {
  endpoint: string;
  canonicalId: string;
  validOn?: string;
}

export const fetchSectionOfLineDetails = createAsyncThunk<
  DetailsNode | null,
  FetchDetailsArgs
>(
  "rinf/fetchSectionOfLineDetails",
  async ({ endpoint, canonicalId, validOn = todayIsoDate() }, { signal }) => {
    const query = buildSectionOfLineDetailsQuery(canonicalId, validOn);
    return toSectionOfLineDetails(
      await runSparqlSelect(endpoint, query, signal),
    );
  },
);

const sectionOfLineDetailsSlice = createSlice({
  name: "rinfSectionOfLineDetails",
  initialState,
  reducers: {
    closeSectionOfLineDetails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionOfLineDetails.pending, (state, action) => {
        state.canonicalId = action.meta.arg.canonicalId;
        state.status = "loading";
        state.details = null;
      })
      .addCase(fetchSectionOfLineDetails.fulfilled, (state, action) => {
        if (action.meta.arg.canonicalId !== state.canonicalId) return;
        state.details = action.payload;
        state.status = action.payload ? "loaded" : "notFound";
      })
      .addCase(fetchSectionOfLineDetails.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (action.meta.arg.canonicalId !== state.canonicalId) return;
        state.status = "failed";
      });
  },
});

export const { closeSectionOfLineDetails } = sectionOfLineDetailsSlice.actions;

export const sectionOfLineDetailsReducer = sectionOfLineDetailsSlice.reducer;
