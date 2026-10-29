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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import type { WorkflowAction } from "../workflow/actions";
import { ACTION_FIELDS, NEGATIVE_ACTIONS, NOTE_REQUIRED } from "./actionFields";
import { ActionFieldInputs } from "./ActionFieldInputs";
import { useActionDraft } from "./hooks/useActionDraft";
import type { PerformAction } from "./hooks/useRequestAction";

interface ActionDialogProps {
  request: LocationCodeRequest;
  action: WorkflowAction;
  perform: PerformAction;
  onClose: () => void;
}

/** Confirms one step, with the note and inputs it needs. */
export const ActionDialog = ({
  request,
  action,
  perform,
  onClose,
}: ActionDialogProps) => {
  const { formatMessage } = useIntl();
  const draft = useActionDraft(request, action);
  const [busy, setBusy] = useState(false);
  const fields = ACTION_FIELDS[action] ?? [];
  const noteRequired = NOTE_REQUIRED.includes(action);

  const confirm = async () => {
    if (!draft.payload) return;
    setBusy(true);
    const succeeded = await perform(action, draft.payload);
    setBusy(false);
    if (succeeded) onClose();
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {formatMessage({ id: `rinf_lc_action_${action}` })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatMessage({ id: `rinf_lc_action_hint_${action}` })}
          </Typography>
          <ActionFieldInputs fields={fields} draft={draft} request={request} />
          <TextField
            multiline
            minRows={3}
            size="small"
            required={noteRequired}
            label={formatMessage({
              id: noteRequired
                ? "rinf_lc_dialog_note_required"
                : "rinf_lc_dialog_note",
            })}
            value={draft.note}
            onChange={(event) => draft.setNote(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {formatMessage({ id: "rinf_lc_dialog_cancel" })}
        </Button>
        <Button
          variant="contained"
          color={NEGATIVE_ACTIONS.includes(action) ? "error" : "primary"}
          onClick={confirm}
          disabled={!draft.payload || busy}
        >
          {formatMessage({ id: `rinf_lc_action_${action}` })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
