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

/** One record of a CSV file, with the line of the file it starts on (1 = first). */
export interface CsvRecord {
  line: number;
  fields: string[];
}

export interface ParsedCsv {
  records: CsvRecord[];
  /** Line on which a quoted field opens and never closes; null when well formed. */
  unclosedQuoteLine: number | null;
}

const BYTE_ORDER_MARK = "﻿";
const QUOTE = '"';
const SEPARATOR = ",";

/** A record of one empty field: an empty line of the file. */
const isEmptyLine = ({ fields }: CsvRecord): boolean =>
  fields.length === 1 && fields[0].trim() === "";

/**
 * Reads comma-separated text as RFC 4180 describes it: a field with a
 * comma, a double quote or a line break is in double quotes, and a double
 * quote inside it is doubled. Lines end with LF or CRLF; a byte order mark
 * and empty lines are skipped. Fields are returned as written, untrimmed.
 */
export const parseCsv = (content: string): ParsedCsv => {
  const text = content.startsWith(BYTE_ORDER_MARK) ? content.slice(1) : content;
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let line = 1;
  let recordLine = 1;
  let quoteLine: number | null = null;

  const endRecord = (): void => {
    records.push({ line: recordLine, fields: [...fields, field] });
    fields = [];
    field = "";
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoteLine !== null) {
      if (character === QUOTE && text[index + 1] === QUOTE) {
        field += QUOTE;
        index += 1;
      } else if (character === QUOTE) quoteLine = null;
      else {
        field += character;
        if (character === "\n") line += 1;
      }
    } else if (character === QUOTE && field === "") quoteLine = line;
    else if (character === SEPARATOR) {
      fields.push(field);
      field = "";
    } else if (character === "\n") {
      endRecord();
      line += 1;
      recordLine = line;
    } else if (character !== "\r") field += character;
  }
  if (field !== "" || fields.length > 0) endRecord();
  return {
    records: records.filter((record) => !isEmptyLine(record)),
    unclosedQuoteLine: quoteLine,
  };
};
