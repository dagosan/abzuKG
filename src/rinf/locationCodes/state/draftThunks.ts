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

Added for the ERA Location Code Manager, 2026-11-10. */

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RequestData } from "../model/LocationCodeRequest";
import type { RequestDraft } from "../model/RequestDraft";
import { locationCodeStore } from "../store/activeStore";

/** The requester's own drafts, for "My requests" and to continue one. */
export const loadDrafts = createAsyncThunk<RequestDraft[], string>(
  "rinf/locationCodes/loadDrafts",
  (owner) => locationCodeStore.loadDrafts(owner),
);

interface SaveDraftArgs {
  id: string;
  data: RequestData;
  owner: string;
}

export const saveRequestDraft = createAsyncThunk<RequestDraft, SaveDraftArgs>(
  "rinf/locationCodes/saveDraft",
  ({ id, data, owner }) => locationCodeStore.saveDraft(id, data, owner),
);

/** Discards a draft; returns its id. */
export const deleteRequestDraft = createAsyncThunk<
  string,
  { id: string; owner: string }
>("rinf/locationCodes/deleteDraft", async ({ id, owner }) => {
  await locationCodeStore.deleteDraft(id, owner);
  return id;
});
