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

Added for the ERA RINF frontend, 2026-10-30. */

import { todayIsoDate } from "../../api/queryParts";
import { fetchSubsidiaryCodes } from "../checks/kgLookups";
import { normalisePrimaryCode } from "../model/codeFormat";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { RegisteredCode } from "../model/RegisteredCode";
import { ACTION_ROLES } from "../workflow/actions";
import { applyAction } from "../workflow/applyAction";
import { availableActions, canBeTakenFrom } from "../workflow/availableActions";
import { formatReference } from "../workflow/createRequest";
import { registerChanges } from "../workflow/publication";
import type {
  LocationCodeSnapshot,
  StepResult,
  WorkflowStep,
} from "./LocationCodeStore";
import {
  STALE_ERROR,
  WRONG_ROLE_ERROR,
  WRONG_STATUS_ERROR,
} from "./storeErrors";

/**
 * Why the step cannot be taken, as Tiamat would answer (ext/era/locationcodes/
 * workflow/StepPermission.java), so both stores refuse the same steps.
 */
const refusalOf = (
  request: LocationCodeRequest,
  { action, actor, expectedEventCount }: WorkflowStep,
  today: string,
): string | null => {
  if (request.events.length !== expectedEventCount) return STALE_ERROR;
  if (!canBeTakenFrom(action, request.status)) return WRONG_STATUS_ERROR;
  if (ACTION_ROLES[action] !== actor.role) return WRONG_ROLE_ERROR;
  const available = availableActions(request, actor, today).find(
    (candidate) => candidate.action === action,
  );
  return available?.blockedBy ?? null;
};

const nextSequence = (snapshot: LocationCodeSnapshot, year: number) =>
  (snapshot.sequences[String(year)] ?? 0) + 1;

/** SLCs the KG links to a PLC being closed with its dependants. */
const kgDependants = async (
  endpoint: string,
  request: LocationCodeRequest,
): Promise<string[]> => {
  const { data } = request;
  const closesDependants =
    data.codeType === "primary" &&
    data.operation === "deactivation" &&
    data.closeDependentCodes;
  return closesDependants
    ? fetchSubsidiaryCodes(endpoint, normalisePrimaryCode(data.targetCode))
    : [];
};

/**
 * One step taken in this browser: refused like Tiamat would, then applied.
 * Returns the step's result and the snapshot to store.
 */
export const takeStepInBrowser = async (
  snapshot: LocationCodeSnapshot,
  step: WorkflowStep,
): Promise<{ result: StepResult; snapshot: LocationCodeSnapshot }> => {
  const request = snapshot.requests.find(({ id }) => id === step.requestId);
  if (!request) throw new Error(`No request ${step.requestId}`);
  const now = new Date().toISOString();
  const refusal = refusalOf(request, step, todayIsoDate());
  if (refusal) throw new Error(refusal);

  const year = new Date().getFullYear();
  const isRegistration = step.action === "register";
  const payload = isRegistration
    ? {
        ...step.payload,
        reference: formatReference(year, nextSequence(snapshot, year)),
      }
    : step.payload;
  const updated = applyAction(request, step.action, step.actor, payload, now);
  const codes: RegisteredCode[] =
    step.action === "publish"
      ? registerChanges(
          updated,
          snapshot.codes,
          await kgDependants(step.endpoint, updated),
          now,
        )
      : [];
  const changedKeys = new Set(codes.map((code) => code.key));
  return {
    result: { request: updated, codes },
    snapshot: {
      requests: snapshot.requests.map((candidate) =>
        candidate.id === updated.id ? updated : candidate,
      ),
      codes: [
        ...snapshot.codes.filter((code) => !changedKeys.has(code.key)),
        ...codes,
      ],
      sequences: isRegistration
        ? {
            ...snapshot.sequences,
            [String(year)]: nextSequence(snapshot, year),
          }
        : snapshot.sequences,
    },
  };
};
