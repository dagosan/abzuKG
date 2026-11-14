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

import type { CodeVersion } from "../model/CodeVersion";
import { isActiveOn, versionsOf } from "../model/codeVersions";
import { codeTypeOf } from "./bulkLineChecks";
import { primaryCodeOfLine, subsidiaryKeyOfLine } from "./bulkLineCodes";
import { BulkFailure, BulkLine, failure } from "./bulkReport";
import { isIsoDate } from "./bulkValueFormats";

const COUNTRY_LENGTH = 2;

/** What the lines are compared with: the register, and the Knowledge Graph's PLCs. */
export interface BulkCheckContext {
  today: string;
  /** Every version in the register, closed ones too. */
  register: readonly CodeVersion[];
  /** PLCs the Knowledge Graph holds for the countries asked; null when it could not be reached. */
  knowledgeGraphCodes: ReadonlySet<string> | null;
  /** PLCs asked for on lines of the same file: not yet codes, refused as parents on their own ground. */
  proposedInFile?: ReadonlySet<string>;
}

/** A proposed PLC is free (BR-10). */
const proposedPrimaryFailures = (
  line: BulkLine,
  { register }: BulkCheckContext,
): BulkFailure[] => {
  const code = primaryCodeOfLine(line);
  if (!code) return [];
  // In the register at any time: a value is never used again.
  return versionsOf(register, code).length > 0
    ? [
        failure("Primary_Location_Code", "BR-10", "rinf_lc_bulk_code_taken", {
          code,
        }),
      ]
    : [];
};

/** The parent of an SLC is active when the SLC starts (BR-02), and started by then (BR-14). */
const parentFailures = (
  line: BulkLine,
  { today, register, knowledgeGraphCodes, proposedInFile }: BulkCheckContext,
): BulkFailure[] => {
  const code = primaryCodeOfLine(line);
  if (!code || proposedInFile?.has(code)) return [];
  const given = line.values.Start_Validity ?? "";
  const start = isIsoDate(given) ? given : today;
  const versions = versionsOf(register, code);
  const refuse = (rule: "BR-02" | "BR-14", messageId: string, date = start) => [
    failure("Primary_Location_Code", rule, messageId, { code, date }),
  ];

  if (versions.length === 0) {
    if (knowledgeGraphCodes === null)
      return refuse("BR-02", "rinf_lc_bulk_parent_unchecked");
    return knowledgeGraphCodes.has(code)
      ? []
      : refuse("BR-02", "rinf_lc_bulk_parent_missing");
  }
  const firstStart = versions[0].startValidity;
  if (firstStart && start < firstStart)
    return refuse("BR-14", "rinf_lc_bulk_start_before_parent", firstStart);
  return versions.some((version) => isActiveOn(version, start))
    ? []
    : refuse("BR-02", "rinf_lc_bulk_parent_closed");
};

const proposedSubsidiaryFailures = (
  line: BulkLine,
  { register }: BulkCheckContext,
): BulkFailure[] => {
  const key = subsidiaryKeyOfLine(line);
  return key && versionsOf(register, key).length > 0
    ? [
        failure(
          "Subsidiary_Location_Code",
          "BR-10",
          "rinf_lc_bulk_subsidiary_taken",
          {
            code: line.values.Subsidiary_Location_Code ?? "",
            parent: primaryCodeOfLine(line) ?? "",
          },
        ),
      ]
    : [];
};

/** One line against the codes that exist: the register, and for a parent the Knowledge Graph. */
export const registerFailures = (
  line: BulkLine,
  context: BulkCheckContext,
): BulkFailure[] => {
  if (codeTypeOf(line) === "PLC") return proposedPrimaryFailures(line, context);
  if (codeTypeOf(line) === "SLC")
    return [
      ...parentFailures(line, context),
      ...proposedSubsidiaryFailures(line, context),
    ];
  return [];
};

/**
 * Countries whose PLCs must be read from the Knowledge Graph: those of SLC
 * lines whose parent is not in the register, and those of PLC lines that
 * propose a value (is it a new code, or one that exists already?).
 */
export const countriesToAsk = (
  lines: BulkLine[],
  register: readonly CodeVersion[],
): string[] => [
  ...new Set(
    lines
      .map(primaryCodeOfLine)
      .filter(
        (code): code is string =>
          code !== null && versionsOf(register, code).length === 0,
      )
      .map((code) => code.slice(0, COUNTRY_LENGTH)),
  ),
];
