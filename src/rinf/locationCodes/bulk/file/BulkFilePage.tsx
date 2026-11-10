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

import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../../store/hooks";
import { bulkLinesOf } from "../bulkRequests";
import { BulkBatchActions } from "./BulkBatchActions";
import { BulkFileHeader } from "./BulkFileHeader";
import { BulkLinesTable } from "./BulkLinesTable";

interface BulkFilePageProps {
  bulkId: string;
}

/**
 * One bulk request (LCMS specification FR-08): a file's accepted lines
 * under one reference and one T0. Each line is handled through the steps
 * of the workflow, here for all lines at once or in the line's own file.
 */
export const BulkFilePage = ({ bulkId }: BulkFilePageProps) => {
  const { formatMessage } = useIntl();
  const requests = useAppSelector((state) => state.rinf.locationCodes.requests);
  const lines = useMemo(
    () => bulkLinesOf(requests, bulkId),
    [requests, bulkId],
  );

  if (lines.length === 0)
    return (
      <Typography variant="body2" sx={{ p: 3, color: "text.secondary" }}>
        {formatMessage({ id: "rinf_lc_bulk_file_not_found" })}
      </Typography>
    );
  return (
    <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
      <BulkFileHeader lines={lines} />
      <BulkBatchActions bulkId={bulkId} lines={lines} />
      <BulkLinesTable lines={lines} />
    </Stack>
  );
};
