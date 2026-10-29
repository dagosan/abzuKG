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

import { Alert, Box, Button, Paper, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { todayIsoDate } from "../../api/queryParts";
import type {
  LocationCodeRequest,
  RequestStatus,
} from "../model/LocationCodeRequest";
import type { WorkflowRole } from "../model/roles";
import { clearLocationCodeError } from "../state/locationCodesSlice";
import type { WorkflowAction } from "../workflow/actions";
import { availableActions } from "../workflow/availableActions";
import { IMMEDIATE_ACTIONS, NEGATIVE_ACTIONS } from "./actionFields";
import { ActionDialog } from "./ActionDialog";
import type { PerformAction } from "./hooks/useRequestAction";

/** Who the request waits for in each status. */
const WAITING_FOR: Record<RequestStatus, WorkflowRole | null> = {
  submitted: "codeAdministrator",
  registered: "codeAdministrator",
  informationRequested: "requester",
  rinfHarmonisation: "rinfCorrespondent",
  externalCoordination: "externalCoordinationPoint",
  awaitingDecision: "validatingOfficer",
  underReview: "validatingOfficer",
  assigned: "codeAdministrator",
  published: "codeAdministrator",
  rejected: "codeAdministrator",
  closed: null,
};

interface ActionPanelProps {
  request: LocationCodeRequest;
  perform: PerformAction;
}

/** What the current actor can do on the request now, or whom it waits for. */
export const ActionPanel = ({ request, perform }: ActionPanelProps) => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const { actor, working, error } = useAppSelector(
    (state) => state.rinf.locationCodes,
  );
  const [openAction, setOpenAction] = useState<WorkflowAction | null>(null);
  const actions = availableActions(request, actor, todayIsoDate()).filter(
    ({ action }) => action !== "confirmCheck",
  );
  const waitingFor = WAITING_FOR[request.status];

  const start = (action: WorkflowAction) => {
    dispatch(clearLocationCodeError());
    if (IMMEDIATE_ACTIONS.includes(action)) perform(action);
    else setOpenAction(action);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
      {actions.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {waitingFor
            ? formatMessage(
                { id: "rinf_lc_waiting_for" },
                { role: formatMessage({ id: `rinf_lc_role_${waitingFor}` }) },
              )
            : formatMessage({ id: "rinf_lc_nothing_to_do" })}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {actions.map(({ action, blockedBy }) => (
            <Tooltip
              key={action}
              title={blockedBy ? formatMessage({ id: blockedBy }) : ""}
            >
              <span>
                <Button
                  size="small"
                  variant={
                    NEGATIVE_ACTIONS.includes(action) ? "outlined" : "contained"
                  }
                  color={
                    NEGATIVE_ACTIONS.includes(action) ? "error" : "primary"
                  }
                  disabled={Boolean(blockedBy) || working}
                  onClick={() => start(action)}
                >
                  {formatMessage({ id: `rinf_lc_action_${action}` })}
                </Button>
              </span>
            </Tooltip>
          ))}
        </Box>
      )}
      {!actor.name && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {formatMessage({ id: "rinf_lc_enter_your_name" })}
        </Alert>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 1.5 }}
          onClose={() => dispatch(clearLocationCodeError())}
        >
          {error.startsWith("rinf_lc_")
            ? formatMessage({ id: error })
            : formatMessage(
                { id: "rinf_lc_error_action_failed" },
                { message: error },
              )}
        </Alert>
      )}
      {openAction && (
        <ActionDialog
          request={request}
          action={openAction}
          perform={perform}
          onClose={() => setOpenAction(null)}
        />
      )}
    </Paper>
  );
};
