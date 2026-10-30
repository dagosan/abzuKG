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
Modified 2026-10-30: steps are taken by the store (Tiamat or this browser), not here. */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { todayIsoDate } from "../../api/queryParts";
import { assignableCode } from "../checks/assignableCode";
import { gatherCheckContext } from "../checks/gatherCheckContext";
import { runTechnicalChecks } from "../checks/technicalChecks";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import type { Actor } from "../model/roles";
import { locationCodeStore } from "../store/activeStore";
import type { StepResult } from "../store/LocationCodeStore";
import type { WorkflowAction } from "../workflow/actions";
import type { ActionPayload } from "../workflow/applyAction";

export interface LoadedData {
  requests: LocationCodeRequest[];
  codes: RegisteredCode[];
}

export const loadLocationCodes = createAsyncThunk<LoadedData>(
  "rinf/locationCodes/load",
  async () => ({
    requests: await locationCodeStore.loadRequests(),
    codes: await locationCodeStore.loadCodes(),
  }),
);

export const submitLocationCodeRequest = createAsyncThunk<
  LocationCodeRequest,
  { data: RequestData; actor: Actor }
>("rinf/locationCodes/submit", ({ data, actor }) =>
  locationCodeStore.submitRequest(data, actor),
);

interface ActionArgs {
  endpoint: string;
  requestId: string;
  action: WorkflowAction;
  actor: Actor;
  payload: ActionPayload;
  /** Events in the copy the actor is looking at. */
  expectedEventCount: number;
}

export type ActionResult = StepResult;

/**
 * Asks the store to take one step. The facts the register cannot work out
 * yet are gathered here first: the checks and the decision ask the KG, so the
 * value assigned is still free at the moment of assignment. The store (Tiamat,
 * or this browser) decides whether the step may be taken and what it changes.
 */
export const performLocationCodeAction = createAsyncThunk<
  ActionResult,
  ActionArgs
>(
  "rinf/locationCodes/action",
  async ({
    endpoint,
    requestId,
    action,
    actor,
    payload,
    expectedEventCount,
  }) => {
    const fullPayload = { ...payload };
    if (action === "runChecks" || action === "assign") {
      const requests = await locationCodeStore.loadRequests();
      const register = await locationCodeStore.loadCodes();
      const request = requests.find((candidate) => candidate.id === requestId);
      if (!request) throw new Error(`No request ${requestId}`);
      const context = await gatherCheckContext(
        endpoint,
        request,
        requests,
        register,
        todayIsoDate(),
      );
      const code = assignableCode(request, context);
      if (action === "runChecks") {
        fullPayload.checks = runTechnicalChecks(request, context);
        fullPayload.assignableCode = code;
      } else {
        if (!code) throw new Error("rinf_lc_error_no_code_available");
        fullPayload.code = code;
      }
    }
    return locationCodeStore.takeStep({
      requestId,
      action,
      actor,
      payload: fullPayload,
      expectedEventCount,
      endpoint,
    });
  },
);
