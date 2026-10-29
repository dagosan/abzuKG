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

import { useMemo } from "react";
import { useAppSelector } from "../../../../store/hooks";
import { todayIsoDate } from "../../../api/queryParts";
import type { LocationCodeRequest } from "../../model/LocationCodeRequest";
import { isAgencyRole, isSamePerson } from "../../model/roles";
import { waitsFor } from "../../workflow/availableActions";
import { isOpen } from "../../workflow/routing";

export type RequestFilter = "forMe" | "open" | "closed" | "all";

export const REQUEST_FILTERS: RequestFilter[] = [
  "forMe",
  "open",
  "closed",
  "all",
];

/** Newest first. */
const bySubmissionDescending = (
  first: LocationCodeRequest,
  second: LocationCodeRequest,
) => second.submittedAt.localeCompare(first.submittedAt);

/**
 * The requests the current actor may see, filtered. A requester sees only
 * their own; Agency roles see all of them.
 */
export const useVisibleRequests = (
  filter: RequestFilter,
): LocationCodeRequest[] => {
  const { requests, actor } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );
  return useMemo(() => {
    const today = todayIsoDate();
    const visible = isAgencyRole(actor.role)
      ? requests
      : requests.filter((request) =>
          isSamePerson(request.submittedBy, actor.name),
        );
    const filtered = visible.filter((request) => {
      if (filter === "forMe") return waitsFor(request, actor, today);
      if (filter === "open") return isOpen(request);
      if (filter === "closed") return !isOpen(request);
      return true;
    });
    return [...filtered].sort(bySubmissionDescending);
  }, [requests, actor, filter]);
};
