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

/** Semicolons, as Abzu's own reports use, so Excel in most of Europe splits columns. */
const DELIMITER = ";";
const LINE_BREAK = "\r\n";
/** Tells Excel the file is UTF-8, so names like "Poznań" survive. */
const BYTE_ORDER_MARK = "﻿";
const NEEDS_QUOTES = /[";\r\n]/;
/** Cells a spreadsheet would run as a formula. */
const FORMULA_START = /^[=+\-@]/;
/** Some browsers (Safari) drop a download whose link is released at once. */
const RELEASE_LINK_AFTER_MS = 1000;

const escapeCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (header: string[], rows: string[][]): string =>
  [header, ...rows]
    .map((row) => row.map(escapeCell).join(DELIMITER))
    .join(LINE_BREAK);

/** Saves `content` as a .csv file through the browser's download. */
export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([BYTE_ORDER_MARK + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), RELEASE_LINK_AFTER_MS);
};
