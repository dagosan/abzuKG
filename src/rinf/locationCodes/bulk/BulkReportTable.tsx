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
  Box,
  Chip,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import type { BulkFailure, BulkReport, CheckedLine } from "./bulkReport";

const COLUMN_IDS = [
  "line",
  "kind",
  "name",
  "result",
  "column",
  "rule",
  "reason",
].map((column) => `rinf_lc_bulk_column_${column}`);
const NONE = "—";

interface ReportRow {
  key: string;
  line: CheckedLine;
  /** Null on the single row of an accepted line. */
  failure: BulkFailure | null;
}

/** One row per accepted line and one per failure, as in the report file. */
const rowsOf = (lines: CheckedLine[]): ReportRow[] =>
  lines.flatMap((line): ReportRow[] =>
    line.failures.length === 0
      ? [{ key: String(line.line), line, failure: null }]
      : line.failures.map((failure, index) => ({
          key: `${line.line}-${index}`,
          line,
          failure,
        })),
  );

interface BulkReportTableProps {
  report: BulkReport;
}

/** The report per line (Annex A.3), with a switch to see the refused lines alone. */
export const BulkReportTable = ({ report }: BulkReportTableProps) => {
  const { formatMessage } = useIntl();
  const [refusedOnly, setRefusedOnly] = useState(false);
  const rows = rowsOf(report.lines).filter(
    (row) => !refusedOnly || row.failure !== null,
  );

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={refusedOnly}
            onChange={(event) => setRefusedOnly(event.target.checked)}
          />
        }
        label={formatMessage({ id: "rinf_lc_bulk_refused_only" })}
      />
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ bgcolor: "background.paper" }}>
          <TableHead>
            <TableRow>
              {COLUMN_IDS.map((columnId) => (
                <TableCell key={columnId}>
                  {formatMessage({ id: columnId })}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ key, line, failure }) => (
              <TableRow key={key}>
                <TableCell>{line.line}</TableCell>
                <TableCell>{line.codeType ?? NONE}</TableCell>
                <TableCell>{line.locationName || NONE}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={failure ? "error" : "success"}
                    label={formatMessage({
                      id: failure
                        ? "rinf_lc_bulk_result_refused"
                        : "rinf_lc_bulk_result_accepted",
                    })}
                  />
                </TableCell>
                <TableCell>{failure?.column ?? ""}</TableCell>
                <TableCell>{failure?.rule ?? ""}</TableCell>
                <TableCell>
                  {failure
                    ? formatMessage({ id: failure.messageId }, failure.values)
                    : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};
