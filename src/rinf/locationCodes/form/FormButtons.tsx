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

Added for the ERA RINF frontend, 2026-11-14. */

import { Button, Stack } from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import { ConfirmDialog } from "../../../components/modern/Dialogs/ConfirmDialog";
import type { RequestForm } from "./hooks/useRequestForm";

type Discard = "reset" | "cancel";

interface FormButtonsProps {
  form: RequestForm;
}

/** Submit, Reset and Cancel; the last two ask first if the form is filled. */
export const FormButtons = ({ form }: FormButtonsProps) => {
  const { formatMessage } = useIntl();
  const { submit, submitting, changed, reset, cancel } = form;
  const [asking, setAsking] = useState<Discard | null>(null);
  const discard = (which: Discard) => (which === "reset" ? reset() : cancel());
  const ask = (which: Discard) => (changed ? setAsking(which) : discard(which));

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button variant="contained" onClick={submit} disabled={submitting}>
        {formatMessage({ id: "rinf_lc_form_submit" })}
      </Button>
      <Button
        variant="outlined"
        onClick={() => ask("reset")}
        disabled={submitting || !changed}
      >
        {formatMessage({ id: "rinf_lc_form_reset" })}
      </Button>
      <Button onClick={() => ask("cancel")} disabled={submitting}>
        {formatMessage({ id: "rinf_lc_form_cancel" })}
      </Button>
      <ConfirmDialog
        open={asking !== null}
        title={formatMessage({ id: "rinf_lc_form_discard_title" })}
        body={formatMessage({
          id: `rinf_lc_form_discard_body_${asking ?? "cancel"}`,
        })}
        confirmText={formatMessage({ id: "rinf_lc_form_discard_confirm" })}
        cancelText={formatMessage({ id: "rinf_lc_form_keep_editing" })}
        onConfirm={() => {
          if (asking) discard(asking);
          setAsking(null);
        }}
        onClose={() => setAsking(null)}
      />
    </Stack>
  );
};
