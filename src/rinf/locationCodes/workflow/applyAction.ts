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

import type { CheckResult, ChecklistItemId } from "../model/checklist";
import type {
  Decision,
  LocationCodeRequest,
  Recommendation,
  RequestData,
  RequestStatus,
  RinfLink,
} from "../model/LocationCodeRequest";
import { GROUND_PROVISIONS, RejectionGround } from "../model/rejectionGrounds";
import type { Actor } from "../model/roles";
import type { WorkflowAction } from "./actions";
import { laterStepChanges } from "./laterStepChanges";
import { statusAfterValidation } from "./routing";

/** What an action brings with it; each action reads the fields it needs. */
export interface ActionPayload {
  note?: string;
  reference?: string;
  data?: RequestData;
  checks?: CheckResult[];
  assignableCode?: string | null;
  confirmedItem?: ChecklistItemId;
  recommendation?: Recommendation;
  link?: RinfLink | null;
  organisation?: string;
  ground?: RejectionGround;
  provision?: string;
  code?: string | null;
}

const closeOpenSuspension = (request: LocationCodeRequest, now: string) =>
  request.suspensions.map((suspension) =>
    suspension.to === null ? { ...suspension, to: now } : suspension,
  );

/** Back to where the request was before information was asked. */
const statusBeforeInformationRequest = (
  request: LocationCodeRequest,
): RequestStatus => (request.registeredAt ? "registered" : "submitted");

const inadmissibleClosure = (
  actor: Actor,
  now: string,
  note: string,
): Decision => ({
  outcome: "reject",
  ground: "inadmissible",
  provision: GROUND_PROVISIONS.inadmissible,
  code: null,
  note,
  by: actor,
  at: now,
});

/** The request after one action; the request file records who did what. */
export const applyAction = (
  request: LocationCodeRequest,
  action: WorkflowAction,
  actor: Actor,
  payload: ActionPayload,
  now: string,
): LocationCodeRequest => {
  const note = payload.note?.trim() ?? "";
  const logged: LocationCodeRequest = {
    ...request,
    events: [...request.events, { at: now, actor, action, note }],
  };
  return { ...logged, ...changesOf(logged, action, actor, payload, now, note) };
};

const changesOf = (
  request: LocationCodeRequest,
  action: WorkflowAction,
  actor: Actor,
  payload: ActionPayload,
  now: string,
  note: string,
): Partial<LocationCodeRequest> => {
  switch (action) {
    case "submit":
      return {};
    case "register":
      return {
        status: "registered",
        reference: payload.reference ?? null,
        registeredAt: now,
      };
    case "returnInadmissible":
    case "closeWithoutReply":
      return {
        status: "rejected",
        suspensions: closeOpenSuspension(request, now),
        decision: inadmissibleClosure(actor, now, note),
      };
    case "requestInformation":
      return {
        status: "informationRequested",
        suspensions: [...request.suspensions, { from: now, to: null }],
      };
    case "replyToInformationRequest":
      return {
        status: statusBeforeInformationRequest(request),
        suspensions: closeOpenSuspension(request, now),
        data: payload.data ?? request.data,
        // The data may have changed, so the checks are run again.
        checks: [],
        checksRunAt: null,
        assignableCode: null,
        confirmedChecks: [],
      };
    case "runChecks":
      return {
        checks: payload.checks ?? [],
        checksRunAt: now,
        assignableCode: payload.assignableCode ?? null,
        confirmedChecks: request.confirmedChecks.filter((item) =>
          payload.checks?.some(
            (result) => result.item === item && result.outcome === "manual",
          ),
        ),
      };
    case "confirmCheck":
      if (!payload.confirmedItem) return {};
      return {
        confirmedChecks: [...request.confirmedChecks, payload.confirmedItem],
      };
    case "completeValidation":
      return {
        status: statusAfterValidation(request),
        recommendation: payload.recommendation ?? null,
        rinfPosition:
          request.data.codeType === "subsidiary"
            ? { outcome: "inherited", link: null, by: actor, at: now }
            : request.rinfPosition,
      };
    default:
      return laterStepChanges(request, action, actor, payload, now, note);
  }
};
