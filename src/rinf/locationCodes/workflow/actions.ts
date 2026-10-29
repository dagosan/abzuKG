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

import type { WorkflowRole } from "../model/roles";

/** Every step a person can take on a request. Text keys: rinf_lc_action_<name>. */
export type WorkflowAction =
  | "submit"
  | "register"
  | "returnInadmissible"
  | "requestInformation"
  | "replyToInformationRequest"
  | "closeWithoutReply"
  | "runChecks"
  | "confirmCheck"
  | "completeValidation"
  | "confirmPosition"
  | "recordNotOnNetwork"
  | "confirmUniqueness"
  | "recordUniquenessNotSecured"
  | "assign"
  | "reject"
  | "publish"
  | "notifyAndClose"
  | "askForReview"
  | "upholdDecision"
  | "reviseDecision";

/** The role each action belongs to (procedure section 5 and 8). */
export const ACTION_ROLES: Record<WorkflowAction, WorkflowRole> = {
  submit: "requester",
  register: "codeAdministrator",
  returnInadmissible: "codeAdministrator",
  requestInformation: "codeAdministrator",
  replyToInformationRequest: "requester",
  closeWithoutReply: "codeAdministrator",
  runChecks: "codeAdministrator",
  confirmCheck: "codeAdministrator",
  completeValidation: "codeAdministrator",
  confirmPosition: "rinfCorrespondent",
  recordNotOnNetwork: "rinfCorrespondent",
  confirmUniqueness: "externalCoordinationPoint",
  recordUniquenessNotSecured: "externalCoordinationPoint",
  assign: "validatingOfficer",
  reject: "validatingOfficer",
  publish: "codeAdministrator",
  notifyAndClose: "codeAdministrator",
  askForReview: "requester",
  upholdDecision: "validatingOfficer",
  reviseDecision: "validatingOfficer",
};

/** Actions that only record something and do not move the request on. */
export const IN_PLACE_ACTIONS: WorkflowAction[] = ["runChecks", "confirmCheck"];
