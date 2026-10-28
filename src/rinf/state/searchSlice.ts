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

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { buildOperationalPointSearchQuery } from "../api/operationalPointSearchQuery";
import { todayIsoDate } from "../api/queryParts";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  OperationalPointSearchResult,
  toOperationalPointSearchResults,
} from "../models/OperationalPointSearchResult";
import type { RinfLoadStatus } from "./loadStatus";
import { readSearchMode, SearchMode, writeSearchMode } from "./preferences";

/** A list longer than this is better narrowed by typing more. */
export const SEARCH_RESULTS_LIMIT = 20;

export interface SearchState {
  mode: SearchMode;
  /** The text the current results are for. */
  searchedText: string;
  status: RinfLoadStatus;
  results: OperationalPointSearchResult[];
}

const initialState: SearchState = {
  mode: readSearchMode(),
  searchedText: "",
  status: "idle",
  results: [],
};

interface SearchArgs {
  endpoint: string;
  text: string;
}

export const searchOperationalPoints = createAsyncThunk<
  OperationalPointSearchResult[],
  SearchArgs
>("rinf/searchOperationalPoints", async ({ endpoint, text }, { signal }) => {
  const query = buildOperationalPointSearchQuery(
    text,
    SEARCH_RESULTS_LIMIT,
    todayIsoDate(),
  );
  return toOperationalPointSearchResults(
    await runSparqlSelect(endpoint, query, signal),
  );
});

const searchSlice = createSlice({
  name: "rinfSearch",
  initialState,
  reducers: {
    setSearchMode(state, action: PayloadAction<SearchMode>) {
      state.mode = action.payload;
      writeSearchMode(action.payload);
    },
    clearSearch(state) {
      state.searchedText = "";
      state.status = "idle";
      state.results = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchOperationalPoints.pending, (state, action) => {
        state.searchedText = action.meta.arg.text;
        state.status = "loading";
        state.results = [];
      })
      .addCase(searchOperationalPoints.fulfilled, (state, action) => {
        if (action.meta.arg.text !== state.searchedText) return;
        state.results = action.payload;
        state.status = "loaded";
      })
      .addCase(searchOperationalPoints.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (action.meta.arg.text !== state.searchedText) return;
        state.status = "failed";
      });
  },
});

export const { setSearchMode, clearSearch } = searchSlice.actions;

export const searchReducer = searchSlice.reducer;
