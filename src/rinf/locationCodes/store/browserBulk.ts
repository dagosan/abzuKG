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

import {
  bulkLinesOf,
  bulkRegistrationRefusal,
  lineReference,
} from "../bulk/bulkRequests";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { Actor } from "../model/roles";
import { applyAction } from "../workflow/applyAction";
import { createRequest, formatReference } from "../workflow/createRequest";
import type { BulkLineData, LocationCodeSnapshot } from "./LocationCodeStore";
import { newId } from "./newId";

interface BulkResult {
  /** The lines as they now stand. */
  lines: LocationCodeRequest[];
  snapshot: LocationCodeSnapshot;
}

const NO_LINES = "rinf_lc_bulk_error_no_lines";

/** One request per line, submitted at the same moment as the lines of one file. */
export const submitBulkInBrowser = (
  snapshot: LocationCodeSnapshot,
  lines: BulkLineData[],
  actor: Actor,
  fileName: string,
): BulkResult => {
  if (lines.length === 0) throw new Error(NO_LINES);
  const now = new Date().toISOString();
  const bulkId = newId();
  const requests = lines.map(({ line, data }) => ({
    ...createRequest(newId(), data, actor, now),
    bulk: { id: bulkId, line, fileName },
  }));
  return {
    lines: requests,
    snapshot: { ...snapshot, requests: [...snapshot.requests, ...requests] },
  };
};

/**
 * Registers the whole bulk request: one reference from the year's sequence,
 * each line's ending with its line number, and one T0 for all of them.
 */
export const registerBulkInBrowser = (
  snapshot: LocationCodeSnapshot,
  bulkId: string,
  actor: Actor,
): BulkResult => {
  const lines = bulkLinesOf(snapshot.requests, bulkId);
  const refusal = bulkRegistrationRefusal(lines, actor);
  if (refusal) throw new Error(refusal);
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const sequence = (snapshot.sequences[String(year)] ?? 0) + 1;
  const reference = formatReference(year, sequence);
  const registered = lines.map((line) =>
    applyAction(
      line,
      "register",
      actor,
      { reference: lineReference(reference, line.bulk?.line ?? 0) },
      now,
    ),
  );
  const byId = new Map(registered.map((line) => [line.id, line]));
  return {
    lines: registered,
    snapshot: {
      ...snapshot,
      requests: snapshot.requests.map(
        (request) => byId.get(request.id) ?? request,
      ),
      sequences: { ...snapshot.sequences, [String(year)]: sequence },
    },
  };
};
