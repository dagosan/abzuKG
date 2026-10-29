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

import type { WorkflowAction } from "../workflow/actions";

/** Extra input an action's dialog asks for, besides the note. */
export type ActionField =
  "recommendation" | "rinfLink" | "organisation" | "ground" | "assignedCode";

export const ACTION_FIELDS: Partial<Record<WorkflowAction, ActionField[]>> = {
  completeValidation: ["recommendation"],
  confirmPosition: ["rinfLink"],
  confirmUniqueness: ["organisation"],
  recordUniquenessNotSecured: ["organisation"],
  assign: ["assignedCode"],
  reject: ["ground"],
};

/** Actions whose note is required: they must say why. */
export const NOTE_REQUIRED: WorkflowAction[] = [
  "returnInadmissible",
  "requestInformation",
  "replyToInformationRequest",
  "closeWithoutReply",
  "recordNotOnNetwork",
  "recordUniquenessNotSecured",
  "reject",
  "askForReview",
  "upholdDecision",
  "reviseDecision",
];

/** Actions taken at once, without a dialog. */
export const IMMEDIATE_ACTIONS: WorkflowAction[] = ["runChecks"];

/** Actions that close a door; shown as such. */
export const NEGATIVE_ACTIONS: WorkflowAction[] = [
  "returnInadmissible",
  "closeWithoutReply",
  "recordNotOnNetwork",
  "recordUniquenessNotSecured",
  "reject",
];
