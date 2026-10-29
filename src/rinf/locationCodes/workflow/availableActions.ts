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

import { isBlocking } from "../model/checklist";
import type {
  LocationCodeRequest,
  RequestStatus,
} from "../model/LocationCodeRequest";
import { Actor, isSamePerson } from "../model/roles";
import { ACTION_ROLES, WorkflowAction } from "./actions";
import { mayAdminister, mayDecide } from "./fourEyes";
import { reviewWindowOpen } from "./deadlines";

/** Statuses each action can be taken from. */
const ACTION_FROM: Record<WorkflowAction, RequestStatus[]> = {
  submit: [],
  register: ["submitted"],
  returnInadmissible: ["submitted"],
  requestInformation: ["submitted", "registered"],
  replyToInformationRequest: ["informationRequested"],
  closeWithoutReply: ["informationRequested"],
  runChecks: ["registered"],
  confirmCheck: ["registered"],
  completeValidation: ["registered"],
  confirmPosition: ["rinfHarmonisation"],
  recordNotOnNetwork: ["rinfHarmonisation"],
  confirmUniqueness: ["externalCoordination"],
  recordUniquenessNotSecured: ["externalCoordination"],
  assign: ["awaitingDecision"],
  reject: ["awaitingDecision"],
  publish: ["assigned"],
  notifyAndClose: ["published", "rejected"],
  askForReview: ["closed"],
  upholdDecision: ["underReview"],
  reviseDecision: ["underReview"],
};

export interface AvailableAction {
  action: WorkflowAction;
  /** Text key saying why the action cannot be taken yet; null when it can. */
  blockedBy: string | null;
}

const hasUnconfirmedManualChecks = (request: LocationCodeRequest) =>
  request.checks.some(
    (result) =>
      result.outcome === "manual" &&
      !request.confirmedChecks.includes(result.item),
  );

/** Why `action` cannot be taken now by `actor`, or null when it can. */
const blockingReason = (
  request: LocationCodeRequest,
  action: WorkflowAction,
  actor: Actor,
  today: string,
): string | null => {
  if (!actor.name.trim()) return "rinf_lc_blocked_no_name";
  const isRequesterAction = ACTION_ROLES[action] === "requester";
  if (isRequesterAction && !isSamePerson(actor.name, request.submittedBy))
    return "rinf_lc_blocked_not_submitter";
  const isAdministratorAction = ACTION_ROLES[action] === "codeAdministrator";
  if (isAdministratorAction && !mayAdminister(request, actor.name))
    return "rinf_lc_blocked_four_eyes";
  switch (action) {
    case "completeValidation":
      if (!request.checksRunAt) return "rinf_lc_blocked_run_checks";
      if (hasUnconfirmedManualChecks(request))
        return "rinf_lc_blocked_manual_checks";
      return null;
    case "assign":
    case "reject":
    case "upholdDecision":
    case "reviseDecision":
      if (!mayDecide(request, actor.name)) return "rinf_lc_blocked_four_eyes";
      if (action === "assign") return assignBlockingReason(request);
      // A published code is changed by an amendment or deactivation request.
      if (
        action === "reviseDecision" &&
        request.review?.originalDecision.outcome === "assign"
      )
        return "rinf_lc_blocked_revise_assignment";
      return null;
    case "askForReview":
      if (request.review) return "rinf_lc_blocked_already_reviewed";
      return reviewWindowOpen(request, today)
        ? null
        : "rinf_lc_blocked_review_window";
    default:
      return null;
  }
};

/** A code is assigned only if nothing fatal was found on the way. */
const assignBlockingReason = (request: LocationCodeRequest): string | null => {
  if (request.checks.some(isBlocking)) return "rinf_lc_blocked_failed_checks";
  if (request.rinfPosition?.outcome === "notOnNetwork")
    return "rinf_lc_blocked_not_on_network";
  if (request.coordination?.outcome === "notSecured")
    return "rinf_lc_blocked_uniqueness";
  return null;
};

/** Actions of the actor's role that apply in the request's current status. */
export const availableActions = (
  request: LocationCodeRequest,
  actor: Actor,
  today: string,
): AvailableAction[] =>
  (Object.keys(ACTION_FROM) as WorkflowAction[])
    .filter((action) => ACTION_FROM[action].includes(request.status))
    .filter((action) => ACTION_ROLES[action] === actor.role)
    .map((action) => ({
      action,
      blockedBy: blockingReason(request, action, actor, today),
    }));

/** Whether the request waits for something `actor` can do now. */
export const waitsFor = (
  request: LocationCodeRequest,
  actor: Actor,
  today: string,
): boolean =>
  availableActions(request, actor, today).some(
    ({ action, blockedBy }) => blockedBy === null && action !== "askForReview",
  );
