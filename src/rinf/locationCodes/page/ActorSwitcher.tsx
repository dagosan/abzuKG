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

import { Box, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { WORKFLOW_ROLES, WorkflowRole } from "../model/roles";
import { setActor } from "../state/locationCodesSlice";

/** Side by side, sharing a phone-width row; fixed widths from sm up. */
const ROLE_FIELD_WIDTH = { xs: "auto", sm: 220 };
const NAME_FIELD_WIDTH = { xs: "auto", sm: 180 };

/**
 * Who the user acts as. Until roles come from the login, anyone picks a
 * role and a name; the four-eyes rule compares names.
 */
export const ActorSwitcher = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const [name, setName] = useState(actor.name);

  useEffect(() => setName(actor.name), [actor.name]);

  const commitName = () => {
    if (name.trim() !== actor.name)
      dispatch(setActor({ ...actor, name: name.trim() }));
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
        flex: { xs: 1, sm: "none" },
        minWidth: 0,
      }}
    >
      <TextField
        select
        size="small"
        label={formatMessage({ id: "rinf_lc_acting_as" })}
        value={actor.role}
        onChange={(event) =>
          dispatch(
            setActor({ ...actor, role: event.target.value as WorkflowRole }),
          )
        }
        sx={{
          width: ROLE_FIELD_WIDTH,
          flex: { xs: 1, sm: "none" },
          minWidth: 0,
        }}
      >
        {WORKFLOW_ROLES.map((role) => (
          <MenuItem key={role} value={role}>
            {formatMessage({ id: `rinf_lc_role_${role}` })}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        label={formatMessage({ id: "rinf_lc_your_name" })}
        value={name}
        error={actor.name === ""}
        onChange={(event) => setName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => event.key === "Enter" && commitName()}
        sx={{
          width: NAME_FIELD_WIDTH,
          flex: { xs: 1, sm: "none" },
          minWidth: 0,
        }}
      />
    </Box>
  );
};
