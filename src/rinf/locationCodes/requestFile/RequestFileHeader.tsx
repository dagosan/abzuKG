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

import { Box, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { CODE_TYPE_ABBREVIATIONS } from "../model/codeTypes";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { DeadlineLabel } from "../page/DeadlineLabel";
import { requestSubject } from "../page/RequestListItem";
import { StatusChip } from "../page/StatusChip";

interface RequestFileHeaderProps {
  request: LocationCodeRequest;
}

/** Reference, what is asked, status and the deadline that runs. */
export const RequestFileHeader = ({ request }: RequestFileHeaderProps) => {
  const { formatMessage, formatDate } = useIntl();
  const { data, reference, status, submittedAt, submittedBy } = request;
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1.5 }}
        >
          {reference ?? formatMessage({ id: "rinf_lc_not_registered" })}
          {" · "}
          {CODE_TYPE_ABBREVIATIONS[data.codeType]}{" "}
          {formatMessage({ id: `rinf_lc_operation_${data.operation}` })}
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          sx={{ color: "primary.main", fontWeight: 700 }}
        >
          {requestSubject(request) || "—"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {formatMessage(
            { id: "rinf_lc_submitted_by" },
            {
              name: submittedBy,
              organisation: data.requester.organisation,
              date: formatDate(submittedAt, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            },
          )}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 0.5,
        }}
      >
        <StatusChip status={status} />
        <DeadlineLabel request={request} />
      </Box>
    </Box>
  );
};
