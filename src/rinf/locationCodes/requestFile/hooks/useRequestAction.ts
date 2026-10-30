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

Added for the ERA RINF frontend, 2026-10-29.
Modified 2026-10-30: sends how many events the shown copy has, so a step on an outdated copy is refused. */

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import { performLocationCodeAction } from "../../state/locationCodesThunks";
import type { WorkflowAction } from "../../workflow/actions";
import type { ActionPayload } from "../../workflow/applyAction";

export type PerformAction = (
  action: WorkflowAction,
  payload?: ActionPayload,
) => Promise<boolean>;

/** Takes a step on the request as the current actor; true when it worked. */
export const useRequestAction = (requestId: string): PerformAction => {
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const expectedEventCount = useAppSelector(
    (state) =>
      state.rinf.locationCodes.requests.find(
        (request) => request.id === requestId,
      )?.events.length ?? 0,
  );
  return useCallback(
    async (action, payload = {}) => {
      const result = await dispatch(
        performLocationCodeAction({
          endpoint,
          requestId,
          action,
          actor,
          payload,
          expectedEventCount,
        }),
      );
      return performLocationCodeAction.fulfilled.match(result);
    },
    [dispatch, endpoint, requestId, actor, expectedEventCount],
  );
};
