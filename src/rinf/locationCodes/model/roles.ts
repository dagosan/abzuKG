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

/** The roles of the procedure (section 5) that act in this workflow. */
export type WorkflowRole =
  | "requester"
  | "codeAdministrator"
  | "rinfCorrespondent"
  | "externalCoordinationPoint"
  | "validatingOfficer";

export const WORKFLOW_ROLES: WorkflowRole[] = [
  "requester",
  "codeAdministrator",
  "rinfCorrespondent",
  "externalCoordinationPoint",
  "validatingOfficer",
];

/** Who is acting: a person's name and the role they act in. */
export interface Actor {
  name: string;
  role: WorkflowRole;
}

/** Roles held by Agency staff; only these may see every request. */
export const isAgencyRole = (role: WorkflowRole): boolean =>
  role !== "requester";

/** Names are compared without case or surrounding spaces. */
export const isSamePerson = (first: string, second: string): boolean =>
  first.trim().toLowerCase() === second.trim().toLowerCase();
