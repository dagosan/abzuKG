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
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useIntl } from "react-intl";
import { useNavigate, useParams } from "react-router-dom";
import { belowAppChromeViewportHeight } from "../../../components/modern/Header/headerMetrics";
import { useAppDispatch } from "../../../store/hooks";
import { NewRequestForm } from "../form/NewRequestForm";
import { RegisterTable } from "../register/RegisterTable";
import { RequestFile } from "../requestFile/RequestFile";
import { cancelPicking } from "../state/locationCodesSlice";
import { loadLocationCodes } from "../state/locationCodesThunks";
import { LocationCodesActionBar } from "./LocationCodesActionBar";
import { REQUEST_ID_PARAM, requestPath } from "./locationCodesPath";
import { RequestList } from "./RequestList";

/** Which part of the page a route shows. */
export type LocationCodesPageMode = "home" | "new" | "request" | "register";

interface LocationCodesPageProps {
  mode: LocationCodesPageMode;
}

/**
 * Routes /location-codes[/new|/register|/:requestId] — the code allocation
 * workflow of the procedure for the assignment of location codes.
 */
export const LocationCodesPage = ({ mode }: LocationCodesPageProps) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams<Record<string, string>>();
  const requestId =
    mode === "request" ? (params[REQUEST_ID_PARAM] ?? null) : null;

  useEffect(() => {
    dispatch(loadLocationCodes());
    // Came back without choosing (e.g. by the tab): the map stops picking.
    dispatch(cancelPicking());
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: belowAppChromeViewportHeight,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Helmet title={formatMessage({ id: "rinf_lc_tab" })} />
      <LocationCodesActionBar
        view={mode === "register" ? "register" : "requests"}
      />
      {mode === "register" ? (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <RegisterTable />
        </Box>
      ) : (
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
              display: { xs: mode === "home" ? "flex" : "none", md: "flex" },
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
              display: { xs: mode === "home" ? "none" : "block", md: "block" },
            }}
          >
            {mode === "new" && <NewRequestForm />}
            {mode === "request" && requestId && (
              <RequestFile key={requestId} requestId={requestId} />
            )}
            {mode === "home" && (
              <Typography
                variant="body2"
                sx={{ p: 3, color: "text.secondary", maxWidth: 640 }}
              >
                {formatMessage({ id: "rinf_lc_home_hint" })}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
