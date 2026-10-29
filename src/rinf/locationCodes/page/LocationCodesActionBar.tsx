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

import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
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
  newRequestPath,
  registerPath,
} from "./locationCodesPath";

const BAR_MIN_HEIGHT = 56;

export type LocationCodesView = "requests" | "register";

interface LocationCodesActionBarProps {
  view: LocationCodesView;
}

/** Requests or register, who the user acts as, and a new request. */
export const LocationCodesActionBar = ({
  view,
}: LocationCodesActionBarProps) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.rinf.locationCodes.actor.role);

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
      <ToggleButtonGroup
        exclusive
        size="small"
        value={view}
        onChange={(_event, next: LocationCodesView | null) =>
          next &&
          navigate(next === "register" ? registerPath : LOCATION_CODES_PATH)
        }
      >
        <ToggleButton value="requests" sx={{ textTransform: "none" }}>
          {formatMessage({ id: "rinf_lc_view_requests" })}
        </ToggleButton>
        <ToggleButton value="register" sx={{ textTransform: "none" }}>
          {formatMessage({ id: "rinf_lc_view_register" })}
        </ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ flexGrow: 1 }} />
      <ActorSwitcher />
      {role === "requester" && (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => navigate(newRequestPath())}
        >
          {formatMessage({ id: "rinf_lc_new_request" })}
        </Button>
      )}
      <DataMenu />
    </Box>
  );
};
