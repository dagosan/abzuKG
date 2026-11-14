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

import { codeTypeOf } from "./bulkLineChecks";
import { primaryCodeOfLine, subsidiaryIdentityOfLine } from "./bulkLineCodes";
import { BulkFailure, BulkLine, failure } from "./bulkReport";

/** The lines that share each value, by value; lines without a value are left out. */
const linesByValue = (
  lines: BulkLine[],
  valueOf: (line: BulkLine) => string | null,
): Map<string, number[]> => {
  const byValue = new Map<string, number[]>();
  lines.forEach((line) => {
    const value = valueOf(line);
    if (value) byValue.set(value, [...(byValue.get(value) ?? []), line.line]);
  });
  return byValue;
};

const others = (lineNumbers: number[], own: number): string =>
  lineNumbers.filter((lineNumber) => lineNumber !== own).join(", ");

/**
 * The three checks of Annex A.3 that compare lines of the same file: the
 * same PLC proposed twice, the same SLC proposed twice, and an SLC whose
 * parent PLC is asked for in this file. Returns the failures per line number.
 */
export const crossLineFailures = (
  lines: BulkLine[],
): Map<number, BulkFailure[]> => {
  const primaryLines = lines.filter((line) => codeTypeOf(line) === "PLC");
  const subsidiaryLines = lines.filter((line) => codeTypeOf(line) === "SLC");
  const proposedPrimary = linesByValue(primaryLines, primaryCodeOfLine);
  const proposedSubsidiary = linesByValue(
    subsidiaryLines,
    subsidiaryIdentityOfLine,
  );
  const failures = new Map<number, BulkFailure[]>();
  const add = (line: number, found: BulkFailure): void => {
    failures.set(line, [...(failures.get(line) ?? []), found]);
  };

  primaryLines.forEach((line) => {
    const sameCode = proposedPrimary.get(primaryCodeOfLine(line) ?? "") ?? [];
    if (sameCode.length > 1)
      add(
        line.line,
        failure(
          "Primary_Location_Code",
          "FILE",
          "rinf_lc_bulk_same_code_twice",
          {
            lines: others(sameCode, line.line),
          },
        ),
      );
  });
  subsidiaryLines.forEach((line) => {
    const sameCode =
      proposedSubsidiary.get(subsidiaryIdentityOfLine(line) ?? "") ?? [];
    if (sameCode.length > 1)
      add(
        line.line,
        failure(
          "Subsidiary_Location_Code",
          "FILE",
          "rinf_lc_bulk_same_subsidiary_twice",
          { lines: others(sameCode, line.line) },
        ),
      );
    const parentLines =
      proposedPrimary.get(primaryCodeOfLine(line) ?? "") ?? [];
    if (parentLines.length > 0)
      add(
        line.line,
        failure(
          "Primary_Location_Code",
          "BR-02",
          "rinf_lc_bulk_parent_in_file",
          {
            lines: parentLines.join(", "),
          },
        ),
      );
  });
  return failures;
};
