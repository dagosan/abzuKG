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

Added for the ERA RINF frontend, 2026-11-01. */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  readShowPreference,
  SHOW_LOCATION_CODES_KEY,
  writeShowPreference,
} from "./preferences";

export interface LocationCodeLabelsState {
  /** Location code labels next to OPs and SoLs; on by default, remembered. */
  show: boolean;
}

const initialState: LocationCodeLabelsState = {
  show: readShowPreference(SHOW_LOCATION_CODES_KEY),
};

const locationCodeLabelsSlice = createSlice({
  name: "rinfLocationCodeLabels",
  initialState,
  reducers: {
    setShowLocationCodes(state, action: PayloadAction<boolean>) {
      state.show = action.payload;
      writeShowPreference(SHOW_LOCATION_CODES_KEY, action.payload);
    },
  },
});

export const { setShowLocationCodes } = locationCodeLabelsSlice.actions;
export const locationCodeLabelsReducer = locationCodeLabelsSlice.reducer;
