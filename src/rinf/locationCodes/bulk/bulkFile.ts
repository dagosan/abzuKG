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

import {
  BulkColumn,
  isBulkColumn,
  MAX_BULK_LINES,
  REQUIRED_COLUMNS,
} from "./bulkColumns";
import type { BulkLine, FileProblem } from "./bulkReport";
import { CsvRecord, parseCsv } from "./parseCsv";

export interface ReadBulkFile {
  /** Not empty: the file is refused as a whole. */
  problems: FileProblem[];
  lines: BulkLine[];
}

const refused = (
  messageId: string,
  values?: FileProblem["values"],
): ReadBulkFile => ({
  problems: [{ messageId, ...(values && { values }) }],
  lines: [],
});

const duplicates = (names: string[]): string[] => [
  ...new Set(names.filter((name, index) => names.indexOf(name) !== index)),
];

const toLine = (
  header: BulkColumn[],
  { line, fields }: CsvRecord,
): BulkLine => ({
  line,
  fieldCount: fields.length,
  headerFieldCount: header.length,
  values: Object.fromEntries(
    header.map((column, index) => [column, (fields[index] ?? "").trim()]),
  ),
});

/** Required columns of the kinds of line the file has, missing from its header. */
const missingColumns = (
  header: BulkColumn[],
  lines: BulkLine[],
): BulkColumn[] => {
  if (!header.includes("Code_Type")) return ["Code_Type"];
  const kinds = (["PLC", "SLC"] as const).filter((kind) =>
    lines.some((line) => line.values.Code_Type === kind),
  );
  const required = new Set(kinds.flatMap((kind) => REQUIRED_COLUMNS[kind]));
  return [...required].filter((column) => !header.includes(column));
};

/**
 * The file checks of Annex A.3: the header names the known columns, each
 * once, with those its lines require, and the file has 1 to 500 data lines.
 * A file that fails one is refused as a whole.
 */
export const readBulkFile = (content: string): ReadBulkFile => {
  const { records, unclosedQuoteLine } = parseCsv(content);
  if (unclosedQuoteLine !== null)
    return refused("rinf_lc_bulk_file_quote", { line: unclosedQuoteLine });
  if (records.length === 0) return refused("rinf_lc_bulk_file_empty");

  const [headerRecord, ...dataRecords] = records;
  const names = headerRecord.fields.map((name) => name.trim());
  const unknown = names.filter((name) => !isBulkColumn(name));
  if (unknown.length > 0)
    return refused("rinf_lc_bulk_file_unknown_columns", {
      columns: unknown.map((name) => name || "(empty)").join(", "),
    });
  const repeated = duplicates(names);
  if (repeated.length > 0)
    return refused("rinf_lc_bulk_file_duplicate_columns", {
      columns: repeated.join(", "),
    });
  if (dataRecords.length === 0) return refused("rinf_lc_bulk_file_no_lines");
  if (dataRecords.length > MAX_BULK_LINES)
    return refused("rinf_lc_bulk_file_too_many", {
      count: dataRecords.length,
      max: MAX_BULK_LINES,
    });

  const header = names.filter(isBulkColumn);
  const lines = dataRecords.map((record) => toLine(header, record));
  const missing = missingColumns(header, lines);
  if (missing.length > 0)
    return refused("rinf_lc_bulk_file_missing_columns", {
      columns: missing.join(", "),
    });
  return { problems: [], lines };
};
