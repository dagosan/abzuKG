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
import { buildParameterDictionaryQuery } from "../api/parameterDictionaryQuery";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  ParameterDictionary,
  toParameterDictionary,
} from "../models/ParameterDictionary";
import type { RinfLoadStatus } from "./loadStatus";

export interface ParameterDictionaryState {
  status: RinfLoadStatus;
  entries: ParameterDictionary;
}

const initialState: ParameterDictionaryState = {
  status: "idle",
  entries: {},
};

interface DictionaryRootState {
  rinf: { parameterDictionary: ParameterDictionaryState };
}

/** Loads the vocabulary once per session; later calls do nothing unless it failed. */
export const fetchParameterDictionary = createAsyncThunk<
  ParameterDictionary,
  string,
  { state: DictionaryRootState }
>(
  "rinf/fetchParameterDictionary",
  async (endpoint) =>
    toParameterDictionary(
      await runSparqlSelect(endpoint, buildParameterDictionaryQuery()),
    ),
  {
    condition: (_endpoint, { getState }) => {
      const { status } = getState().rinf.parameterDictionary;
      return status === "idle" || status === "failed";
    },
  },
);

const parameterDictionarySlice = createSlice({
  name: "rinfParameterDictionary",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchParameterDictionary.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchParameterDictionary.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.status = "loaded";
      })
      .addCase(fetchParameterDictionary.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export const parameterDictionaryReducer = parameterDictionarySlice.reducer;
