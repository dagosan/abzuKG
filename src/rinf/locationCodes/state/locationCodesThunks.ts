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

import { createAsyncThunk } from "@reduxjs/toolkit";
import { todayIsoDate } from "../../api/queryParts";
import { assignableCode } from "../checks/assignableCode";
import { gatherCheckContext } from "../checks/gatherCheckContext";
import { fetchSubsidiaryCodes } from "../checks/kgLookups";
import { runTechnicalChecks } from "../checks/technicalChecks";
import { normalisePrimaryCode } from "../model/codeFormat";
import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import type { Actor } from "../model/roles";
import { locationCodeStore, newId } from "../store/activeStore";
import type { WorkflowAction } from "../workflow/actions";
import { ActionPayload, applyAction } from "../workflow/applyAction";
import { createRequest, formatReference } from "../workflow/createRequest";
import { registerChanges } from "../workflow/publication";

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
>("rinf/locationCodes/submit", async ({ data, actor }) => {
  const request = createRequest(newId(), data, actor, new Date().toISOString());
  await locationCodeStore.saveRequest(request);
  return request;
});

interface ActionArgs {
  endpoint: string;
  requestId: string;
  action: WorkflowAction;
  actor: Actor;
  payload: ActionPayload;
}

export interface ActionResult {
  request: LocationCodeRequest;
  codes: RegisteredCode[];
}

/**
 * Takes one workflow step. Steps that need outside facts get them first:
 * the checks and the decision ask the KG again, so the value assigned is
 * still free at the moment of assignment.
 */
export const performLocationCodeAction = createAsyncThunk<
  ActionResult,
  ActionArgs
>(
  "rinf/locationCodes/action",
  async ({ endpoint, requestId, action, actor, payload }) => {
    const requests = await locationCodeStore.loadRequests();
    const register = await locationCodeStore.loadCodes();
    const request = requests.find((candidate) => candidate.id === requestId);
    if (!request) throw new Error(`No request ${requestId}`);
    const now = new Date().toISOString();
    const today = todayIsoDate();
    const fullPayload = { ...payload };

    if (action === "register") {
      const year = new Date().getFullYear();
      const sequence = await locationCodeStore.nextReferenceSequence(year);
      fullPayload.reference = formatReference(year, sequence);
    }
    if (action === "runChecks" || action === "assign") {
      const context = await gatherCheckContext(
        endpoint,
        request,
        requests,
        register,
        today,
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
    const updated = applyAction(request, action, actor, fullPayload, now);
    const codes =
      action === "publish"
        ? registerChanges(
            updated,
            register,
            await kgDependants(endpoint, updated),
            now,
          )
        : [];
    if (codes.length > 0) await locationCodeStore.saveCodes(codes);
    await locationCodeStore.saveRequest(updated);
    return { request: updated, codes };
  },
);

/** SLCs the KG links to a PLC being closed with its dependants. */
const kgDependants = async (
  endpoint: string,
  request: LocationCodeRequest,
): Promise<string[]> => {
  const { data } = request;
  const closesDependants =
    data.codeType === "primary" &&
    data.operation === "deactivation" &&
    data.closeDependentCodes;
  return closesDependants
    ? fetchSubsidiaryCodes(endpoint, normalisePrimaryCode(data.targetCode))
    : [];
};
