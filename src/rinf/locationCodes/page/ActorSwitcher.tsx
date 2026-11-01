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

import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { WORKFLOW_ROLES, WorkflowRole } from "../model/roles";
import { useLocationCodesLogin } from "../login/useLocationCodesLogin";
import { setActor } from "../state/locationCodesSlice";

/** Side by side, sharing a phone-width row; fixed widths from sm up. */
const ROLE_FIELD_WIDTH = { xs: "auto", sm: 220 };
const NAME_FIELD_WIDTH = { xs: "auto", sm: 180 };

/**
 * Who the user acts as. With a login set up, the name is the account's and
 * the roles are the account's (a choice only when it holds several); without
 * one (development), anyone picks a role and types a name. The four-eyes
 * rule compares names.
 */
export const ActorSwitcher = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((state) => state.rinf.locationCodes.actor);
  const [name, setName] = useState(actor.name);
  const login = useLocationCodesLogin();
  const roleChoices = login.configured ? login.roles : WORKFLOW_ROLES;

  useEffect(() => setName(actor.name), [actor.name]);

  const commitName = () => {
    if (name.trim() !== actor.name)
      dispatch(setActor({ ...actor, name: name.trim() }));
  };

  if (login.configured && !login.loggedIn) {
    return (
      <Button size="small" variant="outlined" onClick={login.login}>
        {formatMessage({ id: "rinf_lc_login" })}
      </Button>
    );
  }
  if (login.configured && roleChoices.length === 0) return null;

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
        value={roleChoices.includes(actor.role) ? actor.role : roleChoices[0]}
        disabled={roleChoices.length < 2}
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
        {roleChoices.map((role) => (
          <MenuItem key={role} value={role}>
            {formatMessage({ id: `rinf_lc_role_${role}` })}
          </MenuItem>
        ))}
      </TextField>
      {login.configured ? (
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {login.name}
        </Typography>
      ) : (
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
      )}
    </Box>
  );
};
