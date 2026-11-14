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

Added for the ERA Location Code Manager, 2026-11-10. */

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";
import { errorText } from "./validityText";

interface MasterDataDialogProps {
  title: string;
  /** Text keys or messages of what stops the save; shown once the user tried. */
  problems: string[];
  busy: boolean;
  onSave: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** The frame of the country and subsidiary type dialogs. */
export const MasterDataDialog = ({
  title,
  problems,
  busy,
  onSave,
  onClose,
  children,
}: MasterDataDialogProps) => {
  const { formatMessage } = useIntl();
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
          {problems.map((problem) => (
            <Alert key={problem} severity="error">
              {errorText(problem, formatMessage)}
            </Alert>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {formatMessage({ id: "rinf_lc_dialog_cancel" })}
        </Button>
        <Button variant="contained" onClick={onSave} disabled={busy}>
          {formatMessage({ id: "rinf_lc_md_save" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
