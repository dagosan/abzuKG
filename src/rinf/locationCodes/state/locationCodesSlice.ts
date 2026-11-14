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

Added for the ERA RINF frontend, 2026-10-29.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-05: codesLoadStatus, the state of the register alone.
Modified 2026-11-09: a point chosen on the map, with its reference OP.
Modified 2026-11-10: master data (countries, subsidiary types).
Modified 2026-11-10: saved drafts.
Modified 2026-11-10: bulk requests. */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { MapPosition } from "../mapLocation/mapPosition";
import type { RinfLoadStatus } from "../../state/loadStatus";
import type {
  LocationCodeRequest,
  RequestData,
  RinfLink,
} from "../model/LocationCodeRequest";
import type { CodeVersion } from "../model/CodeVersion";
import { mergeVersions } from "../model/codeVersions";
import {
  MasterData,
  withCountry,
  withSubsidiaryType,
} from "../model/masterData";
import { defaultMasterData } from "../model/masterDataRegistry";
import { RequestDraft, withDraft, withoutDraft } from "../model/RequestDraft";
import { Actor, isSamePerson } from "../model/roles";
import { readActor, writeActor } from "./actorPreference";
import { registerBulkRequest, submitBulkRequest } from "./bulkThunks";
import {
  deleteRequestDraft,
  loadDrafts,
  saveRequestDraft,
} from "./draftThunks";
import {
  loadLocationCodes,
  loadRegisterCodes,
  performLocationCodeAction,
  submitLocationCodeRequest,
} from "./locationCodesThunks";
import {
  loadMasterData,
  saveCountry,
  saveSubsidiaryType,
} from "./masterDataThunks";

export interface LocationCodesState {
  /** Requests and codes together, for the Location codes tab. */
  loadStatus: RinfLoadStatus;
  /** The register of codes alone: public, so the map can always ask for it. */
  codesLoadStatus: RinfLoadStatus;
  requests: LocationCodeRequest[];
  codes: CodeVersion[];
  /** Countries and subsidiary types; the built-in lists until loaded. */
  masterData: MasterData;
  masterDataLoadStatus: RinfLoadStatus;
  /** The requester's forms saved before submission, last saved first. */
  savedDrafts: RequestDraft[];
  savedDraftsLoadStatus: RinfLoadStatus;
  actor: Actor;
  /** An action or submission is under way. */
  working: boolean;
  /** Text key or message of the last failed action. */
  error: string | null;
  /** Set while the user picks a RINF element on the map for the form. */
  picking: MapPicking | null;
  /** The new request form, kept while the user is on the map. */
  formDraft: RequestData | null;
  /** The saved draft the form is working on, if any; kept while on the map. */
  formDraftId: string | null;
  /** An element was picked on the map; the form fills in from RINF. */
  pendingAutofill: boolean;
  /**
   * Last point chosen with "Use this location": while the form still holds
   * it, RINF's position of the reference element does not replace it.
   */
  positionFromMap: MapPosition | null;
}

export interface MapPicking {
  /** Tracks, platform edges… may be picked too, not only OPs and SoLs. */
  allowAssets: boolean;
  /** Picking the reference OP of this point: only OPs can be used. */
  referencePosition?: MapPosition;
}

const initialState: LocationCodesState = {
  loadStatus: "idle",
  codesLoadStatus: "idle",
  requests: [],
  codes: [],
  masterData: defaultMasterData(),
  masterDataLoadStatus: "idle",
  savedDrafts: [],
  savedDraftsLoadStatus: "idle",
  actor: readActor(),
  working: false,
  error: null,
  picking: null,
  formDraft: null,
  formDraftId: null,
  pendingAutofill: false,
  positionFromMap: null,
};

const replaceRequest = (
  requests: LocationCodeRequest[],
  request: LocationCodeRequest,
) => [...requests.filter((other) => other.id !== request.id), request];

const locationCodesSlice = createSlice({
  name: "rinfLocationCodes",
  initialState,
  reducers: {
    setActor(state, action: PayloadAction<Actor>) {
      const isSameRequester =
        action.payload.role === state.actor.role &&
        isSamePerson(action.payload.name, state.actor.name);
      // Drafts are one person's: another actor starts without them.
      if (!isSameRequester) {
        state.savedDrafts = [];
        state.savedDraftsLoadStatus = "idle";
      }
      state.actor = action.payload;
      writeActor(action.payload);
    },
    clearLocationCodeError(state) {
      state.error = null;
    },
    startPicking(
      state,
      action: PayloadAction<{
        draft: RequestData;
        allowAssets: boolean;
        referencePosition?: MapPosition;
      }>,
    ) {
      const { draft, allowAssets, referencePosition } = action.payload;
      state.formDraft = draft;
      state.picking = {
        allowAssets,
        ...(referencePosition && { referencePosition }),
      };
    },
    setPositionFromMap(state, action: PayloadAction<MapPosition>) {
      state.positionFromMap = action.payload;
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
      state.formDraftId = null;
    },
    setFormDraftId(state, action: PayloadAction<string | null>) {
      state.formDraftId = action.payload;
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
        state.codesLoadStatus = "loaded";
        state.requests = action.payload.requests;
        state.codes = action.payload.codes;
      })
      .addCase(loadLocationCodes.rejected, (state) => {
        state.loadStatus = "failed";
      })
      .addCase(loadRegisterCodes.pending, (state) => {
        state.codesLoadStatus = "loading";
      })
      .addCase(loadRegisterCodes.fulfilled, (state, action) => {
        state.codesLoadStatus = "loaded";
        state.codes = action.payload;
      })
      .addCase(loadRegisterCodes.rejected, (state) => {
        state.codesLoadStatus = "failed";
      })
      .addCase(loadMasterData.pending, (state) => {
        state.masterDataLoadStatus = "loading";
      })
      .addCase(loadMasterData.fulfilled, (state, action) => {
        state.masterDataLoadStatus = "loaded";
        state.masterData = action.payload;
      })
      .addCase(loadMasterData.rejected, (state) => {
        state.masterDataLoadStatus = "failed";
      })
      .addCase(saveCountry.fulfilled, (state, action) => {
        state.masterData = withCountry(state.masterData, action.payload);
      })
      .addCase(saveSubsidiaryType.fulfilled, (state, action) => {
        state.masterData = withSubsidiaryType(state.masterData, action.payload);
      })
      .addCase(submitBulkRequest.fulfilled, (state, action) => {
        state.requests = action.payload.reduce(replaceRequest, state.requests);
      })
      .addCase(registerBulkRequest.fulfilled, (state, action) => {
        state.requests = action.payload.reduce(replaceRequest, state.requests);
      })
      .addCase(loadDrafts.pending, (state) => {
        state.savedDraftsLoadStatus = "loading";
      })
      .addCase(loadDrafts.fulfilled, (state, action) => {
        state.savedDraftsLoadStatus = "loaded";
        state.savedDrafts = action.payload;
      })
      .addCase(loadDrafts.rejected, (state) => {
        state.savedDraftsLoadStatus = "failed";
      })
      .addCase(saveRequestDraft.fulfilled, (state, action) => {
        state.savedDrafts = withDraft(state.savedDrafts, action.payload);
      })
      .addCase(deleteRequestDraft.fulfilled, (state, action) => {
        state.savedDrafts = withoutDraft(state.savedDrafts, action.payload);
      })
      .addCase(submitLocationCodeRequest.fulfilled, (state, action) => {
        state.requests = replaceRequest(state.requests, action.payload);
        const { draftId } = action.meta.arg;
        if (draftId)
          state.savedDrafts = withoutDraft(state.savedDrafts, draftId);
      })
      .addCase(performLocationCodeAction.pending, (state) => {
        state.working = true;
        state.error = null;
      })
      .addCase(performLocationCodeAction.fulfilled, (state, action) => {
        state.working = false;
        state.requests = replaceRequest(state.requests, action.payload.request);
        state.codes = mergeVersions(state.codes, action.payload.codes);
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
  setPositionFromMap,
  pickRinfElement,
  cancelPicking,
  clearFormDraft,
  setFormDraftId,
  autofillStarted,
} = locationCodesSlice.actions;

export const locationCodesReducer = locationCodesSlice.reducer;
