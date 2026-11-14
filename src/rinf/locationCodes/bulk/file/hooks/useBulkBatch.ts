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
Modified 2026-11-14: a step is taken on the lines ticked, not on all. */

import { useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { todayIsoDate } from "../../../../api/queryParts";
import { useRinfSparqlEndpoint } from "../../../../config/rinfEndpoint";
import type { LocationCodeRequest } from "../../../model/LocationCodeRequest";
import { registerBulkRequest } from "../../../state/bulkThunks";
import { performLocationCodeAction } from "../../../state/locationCodesThunks";
import type { WorkflowAction } from "../../../workflow/actions";
import { batchPayloadsOf, linesReadyFor } from "../../bulkBatch";

const STEP_FAILED = "rinf_lc_error_unknown";

/** A batch under way or just finished. */
export interface BatchProgress {
  action: WorkflowAction;
  done: number;
  total: number;
  /** Lines the step was refused on, with the first reason given. */
  failed: number;
  firstError: string | null;
  running: boolean;
}

export interface BulkBatch {
  progress: BatchProgress | null;
  /** Registers every line under one reference and one T0. */
  register: () => void;
  /** Takes `action` on every ticked line it is open to, one after the other. */
  run: (action: WorkflowAction) => void;
}

/**
 * Steps on several lines of a bulk request. A batch step is the ordinary
 * step, taken line by line by the current actor, so every rule of the
 * workflow applies to each line and each line's file records it.
 * Registration is always of all `lines`; the other steps of `selected`.
 */
export const useBulkBatch = (
  bulkId: string,
  lines: LocationCodeRequest[],
  selected: LocationCodeRequest[],
): BulkBatch => {
  const dispatch = useAppDispatch();
  const endpoint = useRinfSparqlEndpoint();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const register = useCallback(() => {
    const started: BatchProgress = {
      action: "register",
      done: 0,
      total: lines.length,
      failed: 0,
      firstError: null,
      running: true,
    };
    setProgress(started);
    dispatch(registerBulkRequest({ bulkId, actor }))
      .unwrap()
      .then(() =>
        setProgress({ ...started, done: lines.length, running: false }),
      )
      .catch((failure: { message?: string }) =>
        setProgress({
          ...started,
          failed: lines.length,
          firstError: failure.message ?? STEP_FAILED,
          running: false,
        }),
      );
  }, [dispatch, bulkId, actor, lines.length]);

  const run = useCallback(
    (action: WorkflowAction) => {
      const ready = linesReadyFor(selected, action, actor, todayIsoDate());
      let state: BatchProgress = {
        action,
        done: 0,
        total: ready.length,
        failed: 0,
        firstError: null,
        running: true,
      };
      setProgress(state);
      /** One line: its payloads in turn, each on the copy the last one left. */
      const takeOn = async (line: LocationCodeRequest): Promise<void> => {
        let expectedEventCount = line.events.length;
        for (const payload of batchPayloadsOf(line, action)) {
          const { request } = await dispatch(
            performLocationCodeAction({
              endpoint,
              requestId: line.id,
              action,
              actor,
              payload,
              expectedEventCount,
            }),
          ).unwrap();
          expectedEventCount = request.events.length;
        }
      };
      const runAll = async (): Promise<void> => {
        for (const line of ready) {
          try {
            await takeOn(line);
          } catch (failure) {
            state = {
              ...state,
              failed: state.failed + 1,
              firstError:
                state.firstError ??
                (failure as { message?: string }).message ??
                STEP_FAILED,
            };
          }
          state = { ...state, done: state.done + 1 };
          setProgress(state);
        }
        setProgress({ ...state, running: false });
      };
      void runAll();
    },
    [dispatch, endpoint, actor, selected],
  );

  return { progress, register, run };
};
