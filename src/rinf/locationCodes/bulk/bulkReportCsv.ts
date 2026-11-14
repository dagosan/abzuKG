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

import type { IntlShape } from "react-intl";
import type { BulkReport, CheckedLine } from "./bulkReport";

/** The report's columns (Annex A.3). */
export const REPORT_COLUMNS = [
  "line",
  "result",
  "item_ref",
  "column",
  "rule",
  "message",
] as const;

export const ACCEPTED = "ACCEPTED";
export const REFUSED = "REFUSED";

const NEEDS_QUOTES = /[",\n\r]/;

const quoted = (value: string): string =>
  NEEDS_QUOTES.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * One row per accepted line and one per failure. `item_ref` stays empty:
 * a line gets its reference when the request is created, which this check
 * does not do.
 */
const rowsOfLine = (
  { line, failures }: CheckedLine,
  formatMessage: IntlShape["formatMessage"],
): string[][] =>
  failures.length === 0
    ? [[String(line), ACCEPTED, "", "", "", ""]]
    : failures.map(({ column, rule, messageId, values }) => [
        String(line),
        REFUSED,
        "",
        column ?? "",
        rule,
        formatMessage({ id: messageId }, values),
      ]);

/** The report as CSV: comma separated, quotes only where needed, like the bulk file itself. */
export const bulkReportCsv = (
  report: BulkReport,
  formatMessage: IntlShape["formatMessage"],
): string =>
  [
    [...REPORT_COLUMNS],
    ...report.lines.flatMap((line) => rowsOfLine(line, formatMessage)),
  ]
    .map((row) => row.map(quoted).join(","))
    .join("\n") + "\n";
