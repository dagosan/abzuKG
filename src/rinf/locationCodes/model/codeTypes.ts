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

/** The location code types this workflow handles (procedure, section 6). */
export type CodeType = "primary" | "subsidiary";

export const CODE_TYPES: CodeType[] = ["primary", "subsidiary"];

/** What a request asks for (procedure, sections 8, 9 and 10.1). */
export type RequestOperation =
  "newCode" | "existingCode" | "amendment" | "deactivation";

export const REQUEST_OPERATIONS: RequestOperation[] = [
  "newCode",
  "existingCode",
  "amendment",
  "deactivation",
];

/** Operations that create a code, as opposed to changing an existing one. */
export const isCreation = (operation: RequestOperation): boolean =>
  operation === "newCode" || operation === "existingCode";

/** Short label used in lists, e.g. "PLC". */
export const CODE_TYPE_ABBREVIATIONS: Record<CodeType, string> = {
  primary: "PLC",
  subsidiary: "SLC",
};
