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

import { Box, Button, Pagination } from "@mui/material";
import { useIntl } from "react-intl";

/** Same height as Abzu's report footer. */
const FOOTER_MIN_HEIGHT = 48;

interface ReportsFooterProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  canExport: boolean;
  onExport: () => void;
}

/** Pages of results on the left, CSV export of all of them on the right. */
export const ReportsFooter = ({
  pageIndex,
  pageCount,
  onPageChange,
  canExport,
  onExport,
}: ReportsFooterProps) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        bgcolor: "primary.dark",
        px: 2,
        py: 1,
        flexShrink: 0,
        minHeight: FOOTER_MIN_HEIGHT,
      }}
    >
      <Pagination
        count={pageCount}
        page={pageIndex + 1}
        onChange={(_event, page) => onPageChange(page - 1)}
        size="small"
        sx={{
          visibility: pageCount > 1 ? "visible" : "hidden",
          "& .MuiPaginationItem-root": { color: "primary.contrastText" },
        }}
      />
      <Button variant="contained" disabled={!canExport} onClick={onExport}>
        {formatMessage({ id: "rinf_reports_export_csv" })}
      </Button>
    </Box>
  );
};
