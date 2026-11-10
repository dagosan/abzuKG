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

import type { BulkCodeType, BulkColumn } from "./bulkColumns";

/**
 * Which check refused a line (Annex A.3): the admissibility check A1, a
 * business rule, or FILE for a rule of the annex itself.
 */
export type BulkRule =
  "A1" | "BR-02" | "BR-06" | "BR-08" | "BR-10" | "BR-14" | "FILE";

type MessageValues = Record<string, string | number>;

/** Why a line is refused: one per failure, all of them reported. */
export interface BulkFailure {
  /** The column concerned; null when the line as a whole is refused. */
  column: BulkColumn | null;
  rule: BulkRule;
  /** Text key of the reason, with the values it names. */
  messageId: string;
  values?: MessageValues;
}

/** Why a file is refused as a whole. */
export interface FileProblem {
  messageId: string;
  values?: MessageValues;
}

/** One data line of the file, its fields trimmed and named by column. */
export interface BulkLine {
  /** Line number in the file; the header is line 1. */
  line: number;
  values: Partial<Record<BulkColumn, string>>;
  /** Fields on the line, and in the header: they should be as many. */
  fieldCount: number;
  headerFieldCount: number;
}

export interface CheckedLine {
  line: number;
  codeType: BulkCodeType | null;
  /** The name on the line, to recognise it in the report. */
  locationName: string;
  failures: BulkFailure[];
}

/** What the check of one file came to. */
export interface BulkReport {
  fileName: string;
  /** Not empty: the file is refused and no line was checked. */
  fileProblems: FileProblem[];
  lines: CheckedLine[];
  /** False when the Knowledge Graph could not be asked about parent PLCs. */
  knowledgeGraphReached: boolean;
  /** The file's lines as read, to make the request from the accepted ones. */
  source: BulkLine[];
  /** Proposed PLCs the Knowledge Graph already holds: existing codes, not new ones. */
  existingCodes: string[];
  /** False when the register could not be read: lines were not compared with its codes. */
  registerReached: boolean;
}

export const acceptedLines = ({ lines }: BulkReport): CheckedLine[] =>
  lines.filter((line) => line.failures.length === 0);

export const refusedLines = ({ lines }: BulkReport): CheckedLine[] =>
  lines.filter((line) => line.failures.length > 0);

export const failure = (
  column: BulkColumn | null,
  rule: BulkRule,
  messageId: string,
  values?: MessageValues,
): BulkFailure => ({ column, rule, messageId, ...(values && { values }) });
