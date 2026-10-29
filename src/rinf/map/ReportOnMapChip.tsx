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

import CloseIcon from "@mui/icons-material/Close";
import { Button, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { RINF_REPORTS_PATH } from "../reports/rinfReportsPath";
import { hideResultsOnMap } from "../state/parameterSearchSlice";

const TOP_OFFSET = 12;

/** Says the map shows the report's results; leads back to the report, or hides them. */
export const ReportOnMapChip = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { places, searchPath } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );
  const hideLabel = formatMessage({ id: "rinf_reports_hide_on_map" });

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: TOP_OFFSET,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        pl: 2,
        pr: 0.5,
        py: 0.5,
        borderRadius: 4,
        maxWidth: "calc(100% - 32px)",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatMessage({ id: "rinf_reports_on_map" }, { count: places.length })}
      </Typography>
      <Button
        size="small"
        onClick={() => navigate(searchPath ?? RINF_REPORTS_PATH)}
      >
        {formatMessage({ id: "rinf_reports_back_to_report" })}
      </Button>
      <Tooltip title={hideLabel}>
        <IconButton
          size="small"
          aria-label={hideLabel}
          onClick={() => dispatch(hideResultsOnMap())}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};
