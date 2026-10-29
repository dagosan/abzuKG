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

import ScheduleIcon from "@mui/icons-material/Schedule";
import { Box, Tooltip, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { todayIsoDate } from "../../api/queryParts";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { currentDeadline } from "../workflow/deadlines";

/** Share of the target after which the deadline shows as close. */
const CLOSE_TO_DEADLINE = 0.75;
const ICON_SIZE = 14;

interface DeadlineLabelProps {
  request: LocationCodeRequest;
}

/** "Decision: day 7 of 20", coloured as the deadline nears or passes. */
export const DeadlineLabel = ({ request }: DeadlineLabelProps) => {
  const { formatMessage } = useIntl();
  const deadline = currentDeadline(request, todayIsoDate());
  if (!deadline) return null;
  const { milestone, elapsed, target } = deadline;
  const colour =
    elapsed > target
      ? "error.main"
      : elapsed >= target * CLOSE_TO_DEADLINE
        ? "warning.main"
        : "text.secondary";
  return (
    <Tooltip title={formatMessage({ id: "rinf_lc_deadline_hint" })}>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, color: colour }}
      >
        <ScheduleIcon sx={{ fontSize: ICON_SIZE }} />
        <Typography variant="caption" sx={{ color: "inherit" }}>
          {formatMessage(
            { id: "rinf_lc_deadline_progress" },
            {
              milestone: formatMessage({ id: `rinf_lc_deadline_${milestone}` }),
              elapsed,
              target,
            },
          )}
        </Typography>
      </Box>
    </Tooltip>
  );
};
