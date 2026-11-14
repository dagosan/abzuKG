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
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { locationCodeStore } from "../store/activeStore";
import type { BulkLineData } from "../store/LocationCodeStore";

interface SubmitBulkArgs {
  lines: BulkLineData[];
  actor: Actor;
  fileName: string;
}

/** Submits the accepted lines of a bulk file as one request; returns its lines. */
export const submitBulkRequest = createAsyncThunk<
  LocationCodeRequest[],
  SubmitBulkArgs
>("rinf/locationCodes/submitBulk", ({ lines, actor, fileName }) =>
  locationCodeStore.submitBulk(lines, actor, fileName),
);

/** Registers a bulk request: one reference and one T0 for all its lines. */
export const registerBulkRequest = createAsyncThunk<
  LocationCodeRequest[],
  { bulkId: string; actor: Actor }
>("rinf/locationCodes/registerBulk", ({ bulkId, actor }) =>
  locationCodeStore.registerBulk(bulkId, actor),
);
