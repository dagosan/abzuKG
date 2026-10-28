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
import { todayIsoDate } from "../api/queryParts";
import { buildSectionsOfLineQuery } from "../api/sectionsOfLineQuery";
import { runSparqlSelect } from "../api/sparqlClient";
import {
  SectionOfLineSummary,
  toSectionOfLineSummaries,
} from "../models/SectionOfLine";
import { MAP_FEATURES_LIMIT, RinfLoadStatus } from "./loadStatus";
import type { FetchInBoxArgs } from "./operationalPointsSlice";
import {
  readShowPreference,
  SHOW_SECTIONS_OF_LINE_KEY,
  writeShowPreference,
} from "./preferences";

export interface SectionsOfLineState {
  show: boolean;
  items: SectionOfLineSummary[];
  /** True when the last load hit MAP_FEATURES_LIMIT, so some SoLs are missing. */
  truncated: boolean;
  status: RinfLoadStatus;
}

const initialState: SectionsOfLineState = {
  show: readShowPreference(SHOW_SECTIONS_OF_LINE_KEY),
  items: [],
  truncated: false,
  status: "idle",
};

export const fetchSectionsOfLineInBox = createAsyncThunk<
  SectionOfLineSummary[],
  FetchInBoxArgs
>(
  "rinf/fetchSectionsOfLineInBox",
  async ({ endpoint, box, validOn = todayIsoDate() }, { signal }) => {
    const query = buildSectionsOfLineQuery(box, MAP_FEATURES_LIMIT, validOn);
    return toSectionOfLineSummaries(
      await runSparqlSelect(endpoint, query, signal),
    );
  },
);

const sectionsOfLineSlice = createSlice({
  name: "rinfSectionsOfLine",
  initialState,
  reducers: {
    setShowSectionsOfLine(state, action: PayloadAction<boolean>) {
      state.show = action.payload;
      writeShowPreference(SHOW_SECTIONS_OF_LINE_KEY, action.payload);
    },
    clearSectionsOfLine(state) {
      state.items = [];
      state.truncated = false;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionsOfLineInBox.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSectionsOfLineInBox.fulfilled, (state, action) => {
        state.items = action.payload;
        state.truncated = action.payload.length >= MAP_FEATURES_LIMIT;
        state.status = "loaded";
      })
      .addCase(fetchSectionsOfLineInBox.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
      });
  },
});

export const { setShowSectionsOfLine, clearSectionsOfLine } =
  sectionsOfLineSlice.actions;

export const sectionsOfLineReducer = sectionsOfLineSlice.reducer;
