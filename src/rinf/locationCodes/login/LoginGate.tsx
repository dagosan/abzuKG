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

Added for the ERA RINF frontend, 2026-11-01. */

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";
import { useLocationCodesLogin } from "./useLocationCodesLogin";

const SPINNER_SIZE = 24;
const MESSAGE_MAX_WIDTH = 480;

interface LoginGateProps {
  children: ReactNode;
}

/**
 * Requests and every step need a login with a workflow role, when a login is
 * set up. Without one (development), everything shows as before.
 */
export const LoginGate = ({ children }: LoginGateProps) => {
  const { formatMessage } = useIntl();
  const { configured, loading, loggedIn, roles, login } =
    useLocationCodesLogin();

  if (!configured || (loggedIn && roles.length > 0)) return <>{children}</>;

  const message = (id: string, action?: ReactNode) => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="body1" sx={{ maxWidth: MESSAGE_MAX_WIDTH }}>
        {formatMessage({ id })}
      </Typography>
      {action}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={SPINNER_SIZE} />
      </Box>
    );
  }
  if (!loggedIn) {
    return message(
      "rinf_lc_login_prompt",
      <Button variant="contained" onClick={login}>
        {formatMessage({ id: "rinf_lc_login" })}
      </Button>,
    );
  }
  return message("rinf_lc_no_role");
};
