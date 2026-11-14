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

Added for the ERA Location Code Manager, 2026-11-10. */

import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { waitsFor } from "../workflow/availableActions";
import { mayAdminister } from "../workflow/fourEyes";

const LINE_SEPARATOR = "/";

/** The lines of one bulk request, in the order of the file. */
export const bulkLinesOf = (
  requests: readonly LocationCodeRequest[],
  bulkId: string,
): LocationCodeRequest[] =>
  requests
    .filter((request) => request.bulk?.id === bulkId)
    .sort(
      (first, second) => (first.bulk?.line ?? 0) - (second.bulk?.line ?? 0),
    );

/** "LC-2026-0007" + 3 → "LC-2026-0007/3": a line's reference within the request. */
export const lineReference = (reference: string, line: number): string =>
  `${reference}${LINE_SEPARATOR}${line}`;

/** The reference the lines share, without the line; null before registration. */
export const bulkReferenceOf = (
  lines: readonly LocationCodeRequest[],
): string | null =>
  lines.find((line) => line.reference)?.reference?.split(LINE_SEPARATOR)[0] ??
  null;

/**
 * Why the bulk request cannot be registered by `actor`, as a text key, or
 * null when it can: every line still as submitted, by a code administrator
 * who did not decide on it.
 */
export const bulkRegistrationRefusal = (
  lines: readonly LocationCodeRequest[],
  actor: Actor,
): string | null => {
  if (lines.length === 0 || lines.some((line) => line.status !== "submitted"))
    return "rinf_lc_blocked_wrong_status";
  if (actor.role !== "codeAdministrator") return "rinf_lc_blocked_wrong_role";
  if (!actor.name.trim()) return "rinf_lc_blocked_no_name";
  return lines.every((line) => mayAdminister(line, actor.name))
    ? null
    : "rinf_lc_blocked_four_eyes";
};

/** Whether the bulk request waits for something `actor` can do now. */
export const bulkWaitsFor = (
  lines: readonly LocationCodeRequest[],
  actor: Actor,
  today: string,
): boolean =>
  bulkRegistrationRefusal(lines, actor) === null ||
  lines.some((line) => waitsFor(line, actor, today));

/** A single request, or the lines of one bulk request shown as one. */
export type RequestGroup =
  | { kind: "request"; request: LocationCodeRequest }
  | { kind: "bulk"; bulkId: string; lines: LocationCodeRequest[] };

/** `requests` in their order, the lines of a bulk request gathered where its first one stands. */
export const groupRequests = (
  requests: readonly LocationCodeRequest[],
): RequestGroup[] => {
  const seen = new Set<string>();
  return requests.flatMap((request): RequestGroup[] => {
    const bulkId = request.bulk?.id;
    if (!bulkId) return [{ kind: "request", request }];
    if (seen.has(bulkId)) return [];
    seen.add(bulkId);
    return [{ kind: "bulk", bulkId, lines: bulkLinesOf(requests, bulkId) }];
  });
};
