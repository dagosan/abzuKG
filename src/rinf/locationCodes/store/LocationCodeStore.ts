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

Added for the ERA RINF frontend, 2026-10-29; Tiamat backend methods added the same day.
Modified 2026-10-30: the store takes workflow steps (submitRequest, takeStep) instead of saving documents.
Modified 2026-11-02: register as code versions with CRD's columns.
Modified 2026-11-14: bulk requests (one request with a line per code). */

import type {
  LocationCodeRequest,
  RequestData,
} from "../model/LocationCodeRequest";
import type { CodeVersion } from "../model/CodeVersion";
import type { Actor } from "../model/roles";
import type { WorkflowAction } from "../workflow/actions";
import type { ActionPayload } from "../workflow/applyAction";

/** One line of an uploaded bulk file, as a request's data. */
export interface BulkLineData {
  /** Line number in the file; the header is line 1. */
  line: number;
  data: RequestData;
}

/** One step on a request, as the actor asks for it. */
export interface WorkflowStep {
  requestId: string;
  action: WorkflowAction;
  actor: Actor;
  payload: ActionPayload;
  /** Events in the copy the actor acted on; the step is refused if others were added since. */
  expectedEventCount: number;
  /** SPARQL endpoint, for the browser store's lookups; Tiamat uses its own. */
  endpoint: string;
}

/** The request after a step, and the register entries the step changed. */
export interface StepResult {
  request: LocationCodeRequest;
  codes: CodeVersion[];
}

/**
 * Where requests and registered codes are kept, and who takes the workflow
 * steps: this browser (browserStore.ts), or Tiamat (tiamatStore.ts) when
 * bootstrap.json sets `locationCodesApiUrl`. activeStore.ts picks one. Both
 * apply the same rules (workflow/); with Tiamat, its answer is the one that
 * counts.
 */
export interface LocationCodeStore {
  loadRequests(): Promise<LocationCodeRequest[]>;
  loadCodes(): Promise<CodeVersion[]>;
  /** Procedure step 2: records a new request and returns it. */
  submitRequest(data: RequestData, actor: Actor): Promise<LocationCodeRequest>;
  /**
   * A bulk request (LCMS specification FR-08): one request per line, all
   * submitted together as the lines of one file. Returns the lines.
   */
  submitBulk(
    lines: BulkLineData[],
    actor: Actor,
    fileName: string,
  ): Promise<LocationCodeRequest[]>;
  /** Registers every line of a bulk request under one reference and one T0. */
  registerBulk(bulkId: string, actor: Actor): Promise<LocationCodeRequest[]>;
  /** Takes one step, or refuses it with an Error whose message is a text key or the reasons. */
  takeStep(step: WorkflowStep): Promise<StepResult>;
  /** Everything, for the backup file. */
  exportSnapshot(): Promise<LocationCodeSnapshot>;
  /** Loads a backup file. */
  importSnapshot(snapshot: LocationCodeSnapshot): Promise<void>;
}

/** Everything a store holds, for backup and restore. */
export interface LocationCodeSnapshot {
  requests: LocationCodeRequest[];
  codes: CodeVersion[];
  sequences: Record<string, number>;
}
