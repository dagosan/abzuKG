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

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { ActorSwitcher } from "./ActorSwitcher";
import { DataMenu } from "./DataMenu";
import {
  LOCATION_CODES_PATH,
  myRequestsPath,
  newRequestPath,
  registerPath,
} from "./locationCodesPath";

const BAR_MIN_HEIGHT = 56;

export type LocationCodesView = "new" | "mine" | "requests" | "register";

/** Views per role: a requester asks and follows; Agency roles handle cases. */
const REQUESTER_VIEWS: LocationCodesView[] = ["new", "mine", "register"];
const AGENCY_VIEWS: LocationCodesView[] = ["requests", "register"];

const PATH_OF_VIEW: Record<LocationCodesView, string> = {
  new: newRequestPath(),
  mine: myRequestsPath,
  requests: LOCATION_CODES_PATH,
  register: registerPath,
};

const LABEL_OF_VIEW: Record<LocationCodesView, string> = {
  new: "rinf_lc_new_request",
  mine: "rinf_lc_view_mine",
  requests: "rinf_lc_view_requests",
  register: "rinf_lc_view_register",
};

interface LocationCodesActionBarProps {
  view: LocationCodesView;
}

/** The views of the user's role, and who the user acts as. */
export const LocationCodesActionBar = ({
  view,
}: LocationCodesActionBarProps) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.rinf.locationCodes.actor.role);
  const views = role === "requester" ? REQUESTER_VIEWS : AGENCY_VIEWS;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
        minHeight: BAR_MIN_HEIGHT,
      }}
    >
      <Typography variant="subtitle1" component="h1" sx={{ fontWeight: 700 }}>
        {formatMessage({ id: "rinf_lc_title" })}
      </Typography>
      <ToggleButtonGroup exclusive size="small" value={view}>
        {views.map((each) => (
          // A click always navigates: from a request file, "My requests"
          // is already selected but must still lead back to the list.
          <ToggleButton
            key={each}
            value={each}
            onClick={() => navigate(PATH_OF_VIEW[each])}
            sx={{ textTransform: "none" }}
          >
            {formatMessage({ id: LABEL_OF_VIEW[each] })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ flexGrow: 1 }} />
      {/* On a phone this pair takes a line of its own, the menu at its end. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <ActorSwitcher />
        <DataMenu />
      </Box>
    </Box>
  );
};
