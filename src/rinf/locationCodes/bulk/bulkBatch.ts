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

Added for the ERA Location Code Manager, 2026-11-10.
Modified 2026-11-14: validation is completed in batch on the ticked lines unless a check failed. */

import { OTHER_CODES_ON_ELEMENT } from "../checks/primaryChecks";
import { EXISTING_CODE_ON_ITS_ELEMENT } from "../checks/primaryValueChecks";
import type { CheckResult } from "../model/checklist";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import type { WorkflowAction } from "../workflow/actions";
import type { ActionPayload } from "../workflow/applyAction";
import { availableActions } from "../workflow/availableActions";

/**
 * Steps that can be taken on several lines at once, because they need no
 * input of their own: the checks, the confirmations and the plain moves.
 * A step that needs a reason or a choice is taken in the line's own file.
 */
export const BATCH_ACTIONS: WorkflowAction[] = [
  "runChecks",
  "confirmCheck",
  "completeValidation",
  "confirmPosition",
  "assign",
  "publish",
  "notifyAndClose",
];

const unconfirmedManualChecks = (request: LocationCodeRequest) =>
  request.checks
    .filter(
      (result) =>
        result.outcome === "manual" &&
        !request.confirmedChecks.includes(result.item),
    )
    .map((result) => result.item);

/** What the checks of a line leave for the code administrator to read, most serious first. */
export type ChecksToRead = "failed" | "warning" | "otherCodes" | "none";

/**
 * Whether a line's checks ask for a look before a recommendation: one
 * failed, one passed with a warning, or the element already carries other
 * codes, which are listed for the code administrator to read. The warning
 * that an existing code is in the Knowledge Graph for its own element does
 * not count: that is what the first population of existing codes is.
 */
export const checksToRead = ({
  checks,
}: Pick<LocationCodeRequest, "checks">): ChecksToRead => {
  const has = (matches: (result: CheckResult) => boolean) =>
    checks.some(matches);
  if (has(({ outcome }) => outcome === "fail")) return "failed";
  if (
    has(
      ({ outcome, detailId }) =>
        outcome === "warning" && detailId !== EXISTING_CODE_ON_ITS_ELEMENT,
    )
  )
    return "warning";
  return has(({ detailId }) => detailId === OTHER_CODES_ON_ELEMENT)
    ? "otherCodes"
    : "none";
};

/**
 * What a batch step sends for one line; empty when the line is left to its
 * own file: validation is completed with "assign" only where the checks
 * leave nothing to read, a position is confirmed only where the line names
 * its element.
 */
export const batchPayloadsOf = (
  request: LocationCodeRequest,
  action: WorkflowAction,
): ActionPayload[] => {
  switch (action) {
    case "confirmCheck":
      return unconfirmedManualChecks(request).map((confirmedItem) => ({
        confirmedItem,
      }));
    case "completeValidation":
      // The administrator ticked the line with its "Checks" column in view:
      // a warning or other codes on the element no longer hold it back. A
      // failed check does: its recommendation needs a ground.
      return checksToRead(request) === "failed"
        ? []
        : [{ recommendation: { outcome: "assign", ground: null } }];
    case "confirmPosition":
      return request.data.rinfLink ? [{}] : [];
    case "notifyAndClose":
      // Closing after a rejection is done line by line, with the letter in view.
      return request.status === "published" ? [{}] : [];
    default:
      return [{}];
  }
};

/** The lines a batch step would be taken on now by `actor`. */
export const linesReadyFor = (
  lines: readonly LocationCodeRequest[],
  action: WorkflowAction,
  actor: Actor,
  today: string,
): LocationCodeRequest[] =>
  lines.filter(
    (line) =>
      availableActions(line, actor, today).some(
        (available) =>
          available.action === action && available.blockedBy === null,
      ) && batchPayloadsOf(line, action).length > 0,
  );
