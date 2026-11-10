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

import { Box, Button, Stack, Typography } from "@mui/material";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { ChangeEvent, useRef } from "react";
import { useIntl } from "react-intl";
import { downloadCsv } from "../../reports/csv";
import { bulkTemplateCsv, MAX_BULK_LINES } from "./bulkColumns";
import { BulkReportSummary } from "./BulkReportSummary";
import { BulkReportTable } from "./BulkReportTable";
import { useBulkCheck } from "./hooks/useBulkCheck";

const TEMPLATE_FILE_NAME = "location-codes-bulk-template.csv";
const PAGE_MAX_WIDTH = 1320;

/**
 * Bulk requests, first part (LCMS specification FR-08, Annex A): a requester
 * chooses the CSV file, and the file and line checks of the annex are run
 * and reported per line. Nothing is sent to the Agency yet.
 */
export const BulkRequestPage = () => {
  const { formatMessage } = useIntl();
  const { checking, report, check } = useBulkCheck();
  const fileInput = useRef<HTMLInputElement>(null);

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) check(file);
    // The same file can be chosen again after it was corrected.
    event.target.value = "";
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: PAGE_MAX_WIDTH, mx: "auto" }}>
      <Typography variant="h6" component="h2">
        {formatMessage({ id: "rinf_lc_bulk_title" })}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {formatMessage({ id: "rinf_lc_bulk_hint" }, { max: MAX_BULK_LINES })}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<UploadFileOutlined />}
          disabled={checking}
          onClick={() => fileInput.current?.click()}
        >
          {formatMessage({
            id: checking ? "rinf_lc_bulk_checking" : "rinf_lc_bulk_choose_file",
          })}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={() =>
            downloadCsv(TEMPLATE_FILE_NAME, bulkTemplateCsv(), false)
          }
        >
          {formatMessage({ id: "rinf_lc_bulk_download_template" })}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label={formatMessage({ id: "rinf_lc_bulk_choose_file" })}
          onChange={onFileChosen}
        />
      </Stack>
      {report && (
        <Stack spacing={2}>
          <BulkReportSummary report={report} />
          {report.lines.length > 0 && <BulkReportTable report={report} />}
        </Stack>
      )}
    </Box>
  );
};
