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
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { RequestFileSection } from "./RequestFileSection";

interface EventLogProps {
  request: LocationCodeRequest;
}

/** Every step taken, newest first, with who took it in which role. */
export const EventLog = ({ request }: EventLogProps) => {
  const { formatMessage, formatDate } = useIntl();
  const events = [...request.events].reverse();
  return (
    <RequestFileSection titleId="rinf_lc_section_log">
      {events.map((event, index) => (
        <Box
          key={`${event.at}-${index}`}
          sx={{
            py: 0.75,
            borderTop: index === 0 ? 0 : 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2">
            <strong>
              {formatMessage({ id: `rinf_lc_action_${event.action}` })}
            </strong>
            {" — "}
            {event.actor.name} (
            {formatMessage({ id: `rinf_lc_role_${event.actor.role}` })})
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatDate(event.at, { dateStyle: "medium", timeStyle: "short" })}
          </Typography>
          {event.note && (
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
            >
              {event.note}
            </Typography>
          )}
        </Box>
      ))}
    </RequestFileSection>
  );
};
