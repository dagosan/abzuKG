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
import type { RinfLoadStatus } from "../../state/loadStatus";
import type {
  LocationCodeRequest,
  RequestData,
  RinfLink,
} from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import type { Actor } from "../model/roles";
import { readActor, writeActor } from "./actorPreference";
import {
  loadLocationCodes,
  performLocationCodeAction,
  submitLocationCodeRequest,
} from "./locationCodesThunks";

export interface LocationCodesState {
  loadStatus: RinfLoadStatus;
  requests: LocationCodeRequest[];
  codes: RegisteredCode[];
  actor: Actor;
  /** An action or submission is under way. */
  working: boolean;
  /** Text key or message of the last failed action. */
  error: string | null;
  /** Set while the user picks a RINF element on the map for the form. */
  picking: MapPicking | null;
  /** The new request form, kept while the user is on the map. */
  formDraft: RequestData | null;
  /** An element was picked on the map; the form fills in from RINF. */
  pendingAutofill: boolean;
}

export interface MapPicking {
  /** Tracks, platform edges… may be picked too, not only OPs and SoLs. */
  allowAssets: boolean;
}

const initialState: LocationCodesState = {
  loadStatus: "idle",
  requests: [],
  codes: [],
  actor: readActor(),
  working: false,
  error: null,
  picking: null,
  formDraft: null,
  pendingAutofill: false,
};

const replaceRequest = (
  requests: LocationCodeRequest[],
  request: LocationCodeRequest,
) => [...requests.filter((other) => other.id !== request.id), request];

const replaceCodes = (codes: RegisteredCode[], changed: RegisteredCode[]) => {
  const changedKeys = new Set(changed.map((code) => code.key));
  return [...codes.filter((code) => !changedKeys.has(code.key)), ...changed];
};

const locationCodesSlice = createSlice({
  name: "rinfLocationCodes",
  initialState,
  reducers: {
    setActor(state, action: PayloadAction<Actor>) {
      state.actor = action.payload;
      writeActor(action.payload);
    },
    clearLocationCodeError(state) {
      state.error = null;
    },
    startPicking(
      state,
      action: PayloadAction<{ draft: RequestData; allowAssets: boolean }>,
    ) {
      state.formDraft = action.payload.draft;
      state.picking = { allowAssets: action.payload.allowAssets };
    },
    pickRinfElement(state, action: PayloadAction<RinfLink>) {
      if (state.formDraft) state.formDraft.rinfLink = action.payload;
      state.picking = null;
      state.pendingAutofill = true;
    },
    cancelPicking(state) {
      state.picking = null;
    },
    clearFormDraft(state) {
      state.formDraft = null;
    },
    autofillStarted(state) {
      state.pendingAutofill = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadLocationCodes.pending, (state) => {
        state.loadStatus = "loading";
      })
      .addCase(loadLocationCodes.fulfilled, (state, action) => {
        state.loadStatus = "loaded";
        state.requests = action.payload.requests;
        state.codes = action.payload.codes;
      })
      .addCase(loadLocationCodes.rejected, (state) => {
        state.loadStatus = "failed";
      })
      .addCase(submitLocationCodeRequest.fulfilled, (state, action) => {
        state.requests = replaceRequest(state.requests, action.payload);
      })
      .addCase(performLocationCodeAction.pending, (state) => {
        state.working = true;
        state.error = null;
      })
      .addCase(performLocationCodeAction.fulfilled, (state, action) => {
        state.working = false;
        state.requests = replaceRequest(state.requests, action.payload.request);
        state.codes = replaceCodes(state.codes, action.payload.codes);
      })
      .addCase(performLocationCodeAction.rejected, (state, action) => {
        state.working = false;
        state.error = action.error.message ?? "rinf_lc_error_action_failed";
      });
  },
});

export const {
  setActor,
  clearLocationCodeError,
  startPicking,
  pickRinfElement,
  cancelPicking,
  clearFormDraft,
  autofillStarted,
} = locationCodesSlice.actions;

export const locationCodesReducer = locationCodesSlice.reducer;
