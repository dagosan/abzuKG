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
import { Navigate, useNavigate } from "react-router-dom";
import { NewRequestForm } from "../form/NewRequestForm";
import { RequestFile } from "../requestFile/RequestFile";
import { LOCATION_CODES_PATH, requestPath } from "./locationCodesPath";
import { MyRequests } from "./MyRequests";
import { RequestList } from "./RequestList";

const HINT_MAX_WIDTH = 640;

/** Page modes besides the code register, which every role shares. */
export type WorkMode = "home" | "new" | "mine" | "request";

interface RoleViewProps {
  mode: WorkMode;
  requestId: string | null;
}

/**
 * A requester asks for codes and follows their own requests: the form,
 * their list, or one request, each full width. No queue of other cases.
 */
export const RequesterView = ({ mode, requestId }: RoleViewProps) => (
  <Box sx={{ flex: 1, overflow: "auto", minWidth: 0 }}>
    {(mode === "home" || mode === "new") && <NewRequestForm />}
    {mode === "mine" && <MyRequests />}
    {mode === "request" && requestId && (
      <RequestFile key={requestId} requestId={requestId} />
    )}
  </Box>
);

/**
 * Agency roles handle cases: the queue on the left, the open case on the
 * right. They never request codes, so the form is not offered.
 */
export const AgencyView = ({ mode, requestId }: RoleViewProps) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  if (mode === "new" || mode === "mine")
    return <Navigate to={LOCATION_CODES_PATH} replace />;
  const isHome = mode === "home";

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        minHeight: 0,
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <Box
        sx={{
          display: { xs: isHome ? "flex" : "none", md: "flex" },
          minHeight: 0,
          flex: { xs: 1, md: "none" },
        }}
      >
        <RequestList
          selectedId={requestId}
          onOpen={(id) => navigate(requestPath(id))}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          minWidth: 0,
          display: { xs: isHome ? "none" : "block", md: "block" },
        }}
      >
        {requestId && <RequestFile key={requestId} requestId={requestId} />}
        {isHome && (
          <Typography
            variant="body2"
            sx={{ p: 3, color: "text.secondary", maxWidth: HINT_MAX_WIDTH }}
          >
            {formatMessage({ id: "rinf_lc_home_hint" })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
