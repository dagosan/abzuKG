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

import { crossLineFailures } from "./bulkCrossChecks";
import { primaryCodeOfLine } from "./bulkLineCodes";
import { codeTypeOf, lineFormatFailures } from "./bulkLineChecks";
import { BulkCheckContext, registerFailures } from "./bulkRegisterChecks";
import type { BulkLine, CheckedLine } from "./bulkReport";

/**
 * The line checks of Annex A.3: each line on its own (format and rules of
 * A.2), against the codes that exist, and against the other lines. A line
 * whose fields cannot be told apart is not compared further.
 */
export const checkBulkLines = (
  lines: BulkLine[],
  context: BulkCheckContext,
): CheckedLine[] => {
  const readable = lines.filter(
    (line) => line.fieldCount === line.headerFieldCount,
  );
  const acrossLines = crossLineFailures(readable);
  const proposedInFile = new Set(
    readable
      .filter((line) => codeTypeOf(line) === "PLC")
      .map(primaryCodeOfLine)
      .filter((code): code is string => code !== null),
  );
  const withFile = { ...context, proposedInFile };
  return lines.map((line) => {
    const isReadable = readable.includes(line);
    return {
      line: line.line,
      codeType: codeTypeOf(line),
      locationName: line.values.Location_Name ?? "",
      failures: [
        ...lineFormatFailures(line, context.today),
        ...(isReadable ? registerFailures(line, withFile) : []),
        ...(acrossLines.get(line.line) ?? []),
      ],
    };
  });
};
