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
Modified 2026-10-30: steps are taken by the store (Tiamat or this browser), not here.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-05: the map reads the register alone (loadRegisterCodes).
Modified 2026-11-10: a submitted request always carries its country.
Modified 2026-11-10: a submission names the draft it was written from. */

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../../store/store";
import { todayIsoDate } from "../../api/queryParts";
import { assignableCode } from "../checks/assignableCode";
import { gatherCheckContext } from "../checks/gatherCheckContext";
import { runTechnicalChecks } from "../checks/technicalChecks";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { CodeVersion } from "../model/CodeVersion";
import { countryOfRequest } from "../model/requestCountry";
import type { Actor } from "../model/roles";
import { locationCodeStore } from "../store/activeStore";
import type { StepResult } from "../store/LocationCodeStore";
import type { WorkflowAction } from "../workflow/actions";
import type { ActionPayload } from "../workflow/applyAction";

export interface LoadedData {
  requests: LocationCodeRequest[];
  codes: CodeVersion[];
}

interface LoadArgs {
  /** False before logging in: the register is public, requests are not. */
  withRequests?: boolean;
}

export const loadLocationCodes = createAsyncThunk<
  LoadedData,
  LoadArgs | undefined
>("rinf/locationCodes/load", async ({ withRequests = true } = {}) => ({
  requests: withRequests ? await locationCodeStore.loadRequests() : [],
  codes: await locationCodeStore.loadCodes(),
}));

/**
 * The register of codes alone, for the map. It is public, so this works
 * logged in or not, while the requests would be refused without a login.
 */
export const loadRegisterCodes = createAsyncThunk<
  CodeVersion[],
  void,
  { state: RootState }
>("rinf/locationCodes/loadCodes", () => locationCodeStore.loadCodes(), {
  // Several map layers ask at once; the register is fetched once.
  condition: (_, { getState }) =>
    getState().rinf.locationCodes.codesLoadStatus !== "loading",
});

export const submitLocationCodeRequest = createAsyncThunk<
  LocationCodeRequest,
  { data: RequestData; actor: Actor; draftId?: string }
>("rinf/locationCodes/submit", ({ data, actor, draftId }) =>
  // The register wants every request's country (it checks it is one codes
  // are assigned for); the form only asks for it when a PLC is created.
  locationCodeStore.submitRequest(
    { ...data, country: countryOfRequest(data) },
    actor,
    draftId,
  ),
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
