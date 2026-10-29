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

import { Actor, WORKFLOW_ROLES, WorkflowRole } from "../model/roles";

const ACTOR_KEY = "abzuKG.locationCodes.actor";

const DEFAULT_ACTOR: Actor = { name: "", role: "requester" };

const isRole = (value: unknown): value is WorkflowRole =>
  typeof value === "string" && (WORKFLOW_ROLES as string[]).includes(value);

/** Who the user last acted as; remembered per browser. */
export const readActor = (): Actor => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(ACTOR_KEY) ?? "null");
    if (stored && typeof stored.name === "string" && isRole(stored.role))
      return { name: stored.name, role: stored.role };
  } catch {
    // Storage unavailable or unreadable: start as an unnamed requester.
  }
  return DEFAULT_ACTOR;
};

export const writeActor = (actor: Actor): void => {
  try {
    window.localStorage.setItem(ACTOR_KEY, JSON.stringify(actor));
  } catch {
    // Not remembered; the choice still holds for this session.
  }
};
