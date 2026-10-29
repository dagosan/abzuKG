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

import { Box, List, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import {
  REQUEST_FILTERS,
  RequestFilter,
  useVisibleRequests,
} from "./hooks/useVisibleRequests";
import { RequestListItem } from "./RequestListItem";

const LIST_WIDTH = { xs: "100%", md: 380 };

interface RequestListProps {
  selectedId: string | null;
  onOpen: (requestId: string) => void;
}

/** The requests, filtered by what waits for the current actor or by state. */
export const RequestList = ({ selectedId, onOpen }: RequestListProps) => {
  const { formatMessage } = useIntl();
  const [filter, setFilter] = useState<RequestFilter>("forMe");
  const requests = useVisibleRequests(filter);

  return (
    <Box
      sx={{
        width: LIST_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        minHeight: 0,
      }}
    >
      <Tabs
        value={filter}
        onChange={(_event, value: RequestFilter) => setFilter(value)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        {REQUEST_FILTERS.map((value) => (
          <Tab
            key={value}
            value={value}
            label={formatMessage({ id: `rinf_lc_filter_${value}` })}
            sx={{ minWidth: 0, px: 1 }}
          />
        ))}
      </Tabs>
      {requests.length === 0 ? (
        <Typography variant="body2" sx={{ p: 2, color: "text.secondary" }}>
          {formatMessage({ id: `rinf_lc_empty_${filter}` })}
        </Typography>
      ) : (
        <List disablePadding sx={{ overflow: "auto", flex: 1 }}>
          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              selected={request.id === selectedId}
              onOpen={onOpen}
            />
          ))}
        </List>
      )}
    </Box>
  );
};
