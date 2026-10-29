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

import { Box, Stack, Typography } from "@mui/material";
import { Helmet } from "react-helmet";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { isAgencyRole, isSamePerson } from "../model/roles";
import { ActionPanel } from "./ActionPanel";
import { ChecklistSection } from "./ChecklistSection";
import { EventLog } from "./EventLog";
import { useRequestAction } from "./hooks/useRequestAction";
import { ProcedureStepper } from "./ProcedureStepper";
import { RequestDataSection } from "./RequestDataSection";
import { RequestFileHeader } from "./RequestFileHeader";
import { StepRecordsSection } from "./StepRecordsSection";

const FILE_MAX_WIDTH = 960;

interface RequestFileProps {
  requestId: string;
}

/** One request's file (section 13): where it is, what to do, what happened. */
export const RequestFile = ({ requestId }: RequestFileProps) => {
  const { formatMessage } = useIntl();
  const { requests, actor, loadStatus } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );
  const perform = useRequestAction(requestId);
  const request = requests.find((candidate) => candidate.id === requestId);
  const visible =
    request &&
    (isAgencyRole(actor.role) || isSamePerson(request.submittedBy, actor.name));

  if (!request || !visible) {
    return (
      <Typography variant="body2" sx={{ p: 3, color: "text.secondary" }}>
        {formatMessage({
          id:
            loadStatus === "loaded"
              ? "rinf_lc_request_not_found"
              : "rinf_lc_loading",
        })}
      </Typography>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: FILE_MAX_WIDTH }}>
      <Helmet
        title={request.reference ?? formatMessage({ id: "rinf_lc_tab" })}
      />
      <Stack spacing={2}>
        <RequestFileHeader request={request} />
        <ProcedureStepper request={request} />
        <ActionPanel request={request} perform={perform} />
        <RequestDataSection request={request} />
        {isAgencyRole(actor.role) && (
          <ChecklistSection request={request} perform={perform} />
        )}
        <StepRecordsSection request={request} />
        <EventLog request={request} />
      </Stack>
    </Box>
  );
};
