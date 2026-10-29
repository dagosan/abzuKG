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
import { useParams } from "react-router-dom";
import { belowAppChromeViewportHeight } from "../../../components/modern/Header/headerMetrics";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RegisterTable } from "../register/RegisterTable";
import { cancelPicking } from "../state/locationCodesSlice";
import { loadLocationCodes } from "../state/locationCodesThunks";
import {
  LocationCodesActionBar,
  LocationCodesView,
} from "./LocationCodesActionBar";
import { REQUEST_ID_PARAM } from "./locationCodesPath";
import { AgencyView, RequesterView, WorkMode } from "./RoleViews";

/** Which part of the page a route shows. */
export type LocationCodesPageMode = WorkMode | "register";

/** The view the action bar shows as selected. */
const viewOf = (
  mode: LocationCodesPageMode,
  isRequester: boolean,
): LocationCodesView => {
  if (mode === "register") return "register";
  if (!isRequester) return "requests";
  return mode === "mine" || mode === "request" ? "mine" : "new";
};

interface LocationCodesPageProps {
  mode: LocationCodesPageMode;
}

/**
 * Routes /location-codes[/new|/mine|/register|/:requestId] — the code
 * allocation workflow of the procedure for the assignment of location
 * codes, laid out for the role the user acts in.
 */
export const LocationCodesPage = ({ mode }: LocationCodesPageProps) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const params = useParams<Record<string, string>>();
  const requestId =
    mode === "request" ? (params[REQUEST_ID_PARAM] ?? null) : null;
  const isRequester = useAppSelector(
    (state) => state.rinf.locationCodes.actor.role === "requester",
  );

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
      <LocationCodesActionBar view={viewOf(mode, isRequester)} />
      {mode === "register" ? (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <RegisterTable />
        </Box>
      ) : isRequester ? (
        <RequesterView mode={mode} requestId={requestId} />
      ) : (
        <AgencyView mode={mode} requestId={requestId} />
      )}
    </Box>
  );
};
