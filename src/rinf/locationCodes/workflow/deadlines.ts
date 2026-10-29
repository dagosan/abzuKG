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

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { needsExternalCoordination } from "./routing";
import { isoDateOf, workingDaysBetween } from "./workingDays";

/** Targets of procedure section 11, in Agency working days ("proposed"). */
export const ACKNOWLEDGEMENT_DAYS = 1;
export const INFORMATION_REPLY_DAYS = 15;
export const STANDARD_DECISION_DAYS = 20;
export const EXTENDED_DECISION_DAYS = 40;
export const PUBLICATION_DAYS = 2;
export const REVIEW_REQUEST_DAYS = 20;

/** Text keys rinf_lc_deadline_<milestone>. */
export type Milestone =
  | "acknowledgement"
  | "informationReply"
  | "decision"
  | "publication"
  | "reviewRequest";

export interface DeadlineStatus {
  milestone: Milestone;
  elapsed: number;
  target: number;
}

/** First population and external coordination get 40 days, others 20. */
export const decisionTarget = (request: LocationCodeRequest): number =>
  request.data.operation === "existingCode" ||
  needsExternalCoordination(request)
    ? EXTENDED_DECISION_DAYS
    : STANDARD_DECISION_DAYS;

/** Working days since T0, without the days a request for information ran. */
export const elapsedSinceRegistration = (
  request: LocationCodeRequest,
  today: string,
): number => {
  if (!request.registeredAt) return 0;
  const suspended = request.suspensions.reduce(
    (total, { from, to }) => total + workingDaysBetween(from, to ?? today),
    0,
  );
  return Math.max(
    0,
    workingDaysBetween(request.registeredAt, today) - suspended,
  );
};

const openSuspension = (request: LocationCodeRequest) =>
  request.suspensions.find((suspension) => suspension.to === null) ?? null;

/** The deadline that matters in the request's current status, if any. */
export const currentDeadline = (
  request: LocationCodeRequest,
  today: string,
): DeadlineStatus | null => {
  switch (request.status) {
    case "submitted":
      return {
        milestone: "acknowledgement",
        elapsed: workingDaysBetween(request.submittedAt, today),
        target: ACKNOWLEDGEMENT_DAYS,
      };
    case "informationRequested": {
      const suspension = openSuspension(request);
      if (!suspension) return null;
      return {
        milestone: "informationReply",
        elapsed: workingDaysBetween(suspension.from, today),
        target: INFORMATION_REPLY_DAYS,
      };
    }
    case "registered":
    case "rinfHarmonisation":
    case "externalCoordination":
    case "awaitingDecision":
      return {
        milestone: "decision",
        elapsed: elapsedSinceRegistration(request, today),
        target: decisionTarget(request),
      };
    case "assigned":
      if (!request.decision) return null;
      return {
        milestone: "publication",
        elapsed: workingDaysBetween(request.decision.at, today),
        target: PUBLICATION_DAYS,
      };
    case "closed":
      if (!request.notifiedAt || request.review) return null;
      return {
        milestone: "reviewRequest",
        elapsed: workingDaysBetween(request.notifiedAt, today),
        target: REVIEW_REQUEST_DAYS,
      };
    default:
      return null;
  }
};

/** A review may be asked within 20 working days of the notification (14). */
export const reviewWindowOpen = (
  request: LocationCodeRequest,
  today: string,
): boolean =>
  request.notifiedAt !== null &&
  request.decision !== null &&
  workingDaysBetween(isoDateOf(request.notifiedAt), today) <=
    REVIEW_REQUEST_DAYS;
