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

/**
 * Annex A of the procedure: the admissibility and validation checklist. Each
 * item has text keys rinf_lc_check_<id> (the check) and the step it belongs to.
 */
export type ChecklistItemId =
  | "channel"
  | "mandatoryElements"
  | "telematicsStakeholder"
  | "preSubmissionCheck"
  | "language"
  | "noDuplicate"
  | "parentPrimaryCode"
  | "onNetworkNoCompetition"
  | "retailDoublet"
  | "codeValueFree"
  | "dataQuality"
  | "rinfPosition"
  | "externalUniqueness"
  | "entitledRequester"
  | "dependentCodes";

/** Annex A numbers; the last two are procedure rules without an Annex A line. */
export const CHECKLIST_NUMBERS: Record<ChecklistItemId, string> = {
  channel: "1",
  mandatoryElements: "2",
  telematicsStakeholder: "3",
  preSubmissionCheck: "4",
  language: "5",
  noDuplicate: "6",
  parentPrimaryCode: "7",
  onNetworkNoCompetition: "8",
  retailDoublet: "9",
  codeValueFree: "10",
  dataQuality: "11",
  rinfPosition: "12",
  externalUniqueness: "14",
  entitledRequester: "6.7",
  dependentCodes: "9 / 6.2(a)",
};

/**
 * pass / fail / warning come from the automated checks; manual needs the code
 * administrator to confirm it; notApplicable for this kind of request.
 */
export type CheckOutcome =
  "pass" | "fail" | "warning" | "manual" | "notApplicable";

export interface CheckResult {
  item: ChecklistItemId;
  outcome: CheckOutcome;
  /** Text key explaining the outcome, with its values. */
  detailId: string;
  values?: Record<string, string>;
}

export const isBlocking = (result: CheckResult): boolean =>
  result.outcome === "fail";
