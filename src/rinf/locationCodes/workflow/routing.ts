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

import { isCreation } from "../model/codeTypes";
import { isNonEuCountry } from "../model/countries";
import type {
  LocationCodeRequest,
  RequestStatus,
} from "../model/LocationCodeRequest";

/**
 * Step 5 applies to a PLC being created or amended. An SLC inherits the
 * position of its parent PLC (procedure Table 4); closing a code needs none.
 */
export const needsRinfHarmonisation = ({ data }: LocationCodeRequest) =>
  data.codeType === "primary" && data.operation !== "deactivation";

/** Non-EU country or legacy range: uniqueness confirmed first (8.7, 10.3). */
export const needsExternalCoordination = ({ data }: LocationCodeRequest) =>
  isCreation(data.operation) &&
  (isNonEuCountry(data.country) || data.legacyCodingRange);

/** Where a request goes once technical validation is complete. */
export const statusAfterValidation = (
  request: LocationCodeRequest,
): RequestStatus => {
  if (needsRinfHarmonisation(request)) return "rinfHarmonisation";
  return statusAfterHarmonisation(request);
};

/** Where a request goes once its RINF position is settled. */
export const statusAfterHarmonisation = (
  request: LocationCodeRequest,
): RequestStatus =>
  needsExternalCoordination(request)
    ? "externalCoordination"
    : "awaitingDecision";

/** Statuses in which the request is still being handled. */
export const OPEN_STATUSES: RequestStatus[] = [
  "submitted",
  "registered",
  "informationRequested",
  "rinfHarmonisation",
  "externalCoordination",
  "awaitingDecision",
  "assigned",
  "published",
  "rejected",
  "underReview",
];

export const isOpen = (request: LocationCodeRequest): boolean =>
  OPEN_STATUSES.includes(request.status);

/** The procedure step (1–8) under way in each status; 9 when all are done. */
export const STEP_OF_STATUS: Record<RequestStatus, number> = {
  submitted: 3,
  registered: 4,
  informationRequested: 3,
  rinfHarmonisation: 5,
  externalCoordination: 6,
  awaitingDecision: 6,
  underReview: 6,
  assigned: 7,
  rejected: 8,
  published: 8,
  closed: 9,
};
