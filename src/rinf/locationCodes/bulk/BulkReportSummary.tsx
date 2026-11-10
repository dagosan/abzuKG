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

import { Alert, Button, Stack } from "@mui/material";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import { useIntl } from "react-intl";
import { downloadCsv } from "../../reports/csv";
import { acceptedLines, BulkReport, refusedLines } from "./bulkReport";
import { bulkReportCsv } from "./bulkReportCsv";

const REPORT_SUFFIX = "-report.csv";
const CSV_EXTENSION = /\.csv$/i;

interface BulkReportSummaryProps {
  report: BulkReport;
}

/** What the check came to: the file refused, or how many lines pass, with what limits the check. */
export const BulkReportSummary = ({ report }: BulkReportSummaryProps) => {
  const { formatMessage } = useIntl();
  const { fileName, fileProblems, lines } = report;

  if (fileProblems.length > 0)
    return (
      <Stack spacing={1}>
        {fileProblems.map(({ messageId, values }) => (
          <Alert key={messageId} severity="error">
            {formatMessage({ id: "rinf_lc_bulk_file_refused" }, { fileName })}{" "}
            {formatMessage({ id: messageId }, values)}
          </Alert>
        ))}
      </Stack>
    );

  const refused = refusedLines(report).length;
  const download = () =>
    downloadCsv(
      fileName.replace(CSV_EXTENSION, "") + REPORT_SUFFIX,
      bulkReportCsv(report, formatMessage),
      false,
    );

  return (
    <Stack spacing={1}>
      <Alert
        severity={refused === 0 ? "success" : "warning"}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<DownloadOutlined />}
            onClick={download}
          >
            {formatMessage({ id: "rinf_lc_bulk_download_report" })}
          </Button>
        }
      >
        {formatMessage(
          { id: "rinf_lc_bulk_summary" },
          {
            fileName,
            total: lines.length,
            accepted: acceptedLines(report).length,
            refused,
          },
        )}
      </Alert>
      {!report.registerReached && (
        <Alert severity="warning">
          {formatMessage({ id: "rinf_lc_bulk_register_unreachable" })}
        </Alert>
      )}
      {!report.knowledgeGraphReached && (
        <Alert severity="warning">
          {formatMessage({ id: "rinf_lc_bulk_kg_unreachable" })}
        </Alert>
      )}
      <Alert severity="info">
        {formatMessage({ id: "rinf_lc_bulk_nothing_sent" })}
      </Alert>
    </Stack>
  );
};
