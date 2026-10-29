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

import { Box, List, Paper, Typography } from "@mui/material";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useVisibleRequests } from "./hooks/useVisibleRequests";
import { requestPath } from "./locationCodesPath";
import { RequestListItem } from "./RequestListItem";

const LIST_MAX_WIDTH = 760;

/**
 * A requester's own requests, newest first: where each one stands and,
 * when the Agency asks for something, the way back into it.
 */
export const MyRequests = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const requests = useVisibleRequests("all");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: LIST_MAX_WIDTH }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {formatMessage({ id: "rinf_lc_view_mine" })}
      </Typography>
      {requests.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatMessage({ id: "rinf_lc_empty_mine" })}
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {requests.map((request) => (
              <RequestListItem
                key={request.id}
                request={request}
                selected={false}
                onOpen={(id) => navigate(requestPath(id))}
              />
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
