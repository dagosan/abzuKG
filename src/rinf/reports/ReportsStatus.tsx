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

import { Box, CircularProgress, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";

const SPINNER_SIZE = 20;

/** Above the table: what to do first, searching, failed, nothing found, or cut short. */
export const ReportsStatus = () => {
  const { formatMessage } = useIntl();
  const { resultsStatus, places, truncated } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );

  const message = (
    id: string,
    color: string,
    values?: Record<string, number>,
  ) => (
    <Typography variant="body2" sx={{ p: 2, color }}>
      {formatMessage({ id }, values)}
    </Typography>
  );

  if (resultsStatus === "idle") {
    return message("rinf_reports_start", "text.secondary");
  }
  if (resultsStatus === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
        <CircularProgress size={SPINNER_SIZE} />
        <Typography variant="body2">
          {formatMessage({ id: "rinf_parameter_search_searching" })}
        </Typography>
      </Box>
    );
  }
  if (resultsStatus === "failed") {
    return message("rinf_parameter_search_failed", "error.main");
  }
  if (places.length === 0) {
    return message("rinf_parameter_search_nothing", "text.secondary");
  }
  if (truncated) {
    return message("rinf_parameter_search_truncated", "warning.main", {
      count: places.length,
    });
  }
  return null;
};
