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
import { buildSectionOfLineSearchQuery } from "../api/sectionOfLineSearchQuery";
import { runSparqlSelect } from "../api/sparqlClient";
import { toOperationalPointSearchResults } from "../models/OperationalPointSearchResult";
import {
  combineSearchResults,
  RinfSearchResult,
} from "../models/RinfSearchResult";
import { toSectionOfLineSearchResults } from "../models/SectionOfLineSearchResult";
import type { RinfLoadStatus } from "./loadStatus";
import { readSearchMode, SearchMode, writeSearchMode } from "./preferences";

/** A list longer than this is better narrowed by typing more. */
export const SEARCH_RESULTS_LIMIT = 20;
/** Higher, so that a line number lists most of the line's sections. */
export const SECTION_RESULTS_LIMIT = 40;

export interface SearchState {
  mode: SearchMode;
  /** The text the current results are for. */
  searchedText: string;
  status: RinfLoadStatus;
  results: RinfSearchResult[];
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

/**
 * Searches OPs and sections of line in parallel (~2 s and ~3 s). If one of
 * the two fails, the other's results are still shown; it fails only if both do.
 */
export const searchRinf = createAsyncThunk<RinfSearchResult[], SearchArgs>(
  "rinf/search",
  async ({ endpoint, text }, { signal }) => {
    const validOn = todayIsoDate();
    const [operationalPoints, sectionsOfLine] = await Promise.allSettled([
      runSparqlSelect(
        endpoint,
        buildOperationalPointSearchQuery(text, SEARCH_RESULTS_LIMIT, validOn),
        signal,
      ).then(toOperationalPointSearchResults),
      runSparqlSelect(
        endpoint,
        buildSectionOfLineSearchQuery(text, SECTION_RESULTS_LIMIT, validOn),
        signal,
      ).then(toSectionOfLineSearchResults),
    ]);
    if (
      operationalPoints.status === "rejected" &&
      sectionsOfLine.status === "rejected"
    ) {
      throw operationalPoints.reason;
    }
    return combineSearchResults(
      operationalPoints.status === "fulfilled" ? operationalPoints.value : [],
      sectionsOfLine.status === "fulfilled" ? sectionsOfLine.value : [],
    );
  },
);

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
      .addCase(searchRinf.pending, (state, action) => {
        state.searchedText = action.meta.arg.text;
        state.status = "loading";
        state.results = [];
      })
      .addCase(searchRinf.fulfilled, (state, action) => {
        if (action.meta.arg.text !== state.searchedText) return;
        state.results = action.payload;
        state.status = "loaded";
      })
      .addCase(searchRinf.rejected, (state, action) => {
        if (action.meta.aborted) return;
        if (action.meta.arg.text !== state.searchedText) return;
        state.status = "failed";
      });
  },
});

export const { setSearchMode, clearSearch } = searchSlice.actions;

export const searchReducer = searchSlice.reducer;
