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

import type {
  LocationCodeRequest,
  RequestStatus,
} from "../model/LocationCodeRequest";
import { GROUND_PROVISIONS } from "../model/rejectionGrounds";
import type { Actor } from "../model/roles";
import type { WorkflowAction } from "./actions";
import type { ActionPayload } from "./applyAction";
import { statusAfterHarmonisation } from "./routing";

/** Status after a review revises a decision: back to the open step. */
const statusAfterRevision = (request: LocationCodeRequest): RequestStatus => {
  if (!request.registeredAt) return "submitted";
  return request.checksRunAt ? "awaitingDecision" : "registered";
};

/** Changes made by the steps after technical validation (5 to 8, and 14). */
export const laterStepChanges = (
  request: LocationCodeRequest,
  action: WorkflowAction,
  actor: Actor,
  payload: ActionPayload,
  now: string,
  note: string,
): Partial<LocationCodeRequest> => {
  switch (action) {
    case "confirmPosition": {
      const link = payload.link ?? request.data.rinfLink;
      return {
        status: statusAfterHarmonisation(request),
        rinfPosition: { outcome: "confirmed", link, by: actor, at: now },
        data: { ...request.data, rinfLink: link },
      };
    }
    case "recordNotOnNetwork":
      return {
        status: "awaitingDecision",
        rinfPosition: {
          outcome: "notOnNetwork",
          link: null,
          by: actor,
          at: now,
        },
      };
    case "confirmUniqueness":
    case "recordUniquenessNotSecured":
      return {
        status: "awaitingDecision",
        coordination: {
          outcome: action === "confirmUniqueness" ? "confirmed" : "notSecured",
          organisation: payload.organisation?.trim() ?? "",
          by: actor,
          at: now,
        },
      };
    case "assign":
    case "reject": {
      const isAssignment = action === "assign";
      const ground = isAssignment ? null : (payload.ground ?? null);
      return {
        status: isAssignment ? "assigned" : "rejected",
        decision: {
          outcome: isAssignment ? "assign" : "reject",
          ground,
          provision:
            payload.provision ?? (ground ? GROUND_PROVISIONS[ground] : ""),
          code: isAssignment ? (payload.code ?? null) : null,
          note,
          by: actor,
          at: now,
        },
      };
    }
    case "publish":
      return { status: "published", publishedAt: now };
    case "notifyAndClose":
      return { status: "closed", notifiedAt: now };
    case "askForReview":
      if (!request.decision) return {};
      return {
        status: "underReview",
        review: {
          askedAt: now,
          reasons: note,
          outcome: null,
          originalDecision: request.decision,
          by: null,
        },
      };
    case "upholdDecision":
      if (!request.review) return {};
      return {
        status: "closed",
        review: { ...request.review, outcome: "upheld", by: actor },
      };
    case "reviseDecision":
      if (!request.review) return {};
      return {
        status: statusAfterRevision(request),
        decision: null,
        notifiedAt: null,
        review: { ...request.review, outcome: "revised", by: actor },
      };
    default:
      return {};
  }
};
