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
import { isSamePerson } from "../model/roles";

/** Names of everyone who acted on the request as code administrator. */
export const codeAdministratorsOf = (request: LocationCodeRequest): string[] =>
  request.events
    .filter((event) => event.actor.role === "codeAdministrator")
    .map((event) => event.actor.name);

/**
 * The code administrator and the validating officer for a request may not be
 * the same person (procedure, Table 3); nor may a review be decided by the
 * person who took the original decision (section 14).
 */
export const mayDecide = (
  request: LocationCodeRequest,
  name: string,
): boolean => {
  const administeredIt = codeAdministratorsOf(request).some((administrator) =>
    isSamePerson(administrator, name),
  );
  const decidedBefore = request.review
    ? isSamePerson(request.review.originalDecision.by.name, name)
    : false;
  return !administeredIt && !decidedBefore;
};

/**
 * The validating officer may not then administer the same request. Closures
 * as inadmissible are taken by the code administrator and do not count.
 */
export const mayAdminister = (
  request: LocationCodeRequest,
  name: string,
): boolean => {
  const decisions = [request.decision, request.review?.originalDecision];
  return !decisions.some(
    (decision) =>
      decision &&
      decision.by.role === "validatingOfficer" &&
      isSamePerson(decision.by.name, name),
  );
};
