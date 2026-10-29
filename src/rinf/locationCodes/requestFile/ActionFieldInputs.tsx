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

import { Alert, MenuItem, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { RinfElementPicker } from "../form/RinfElementPicker";
import type { LocationCodeRequest } from "../model/LocationCodeRequest";
import { REJECTION_GROUNDS, RejectionGround } from "../model/rejectionGrounds";
import type { ActionField } from "./actionFields";
import type { ActionDraft } from "./hooks/useActionDraft";

interface ActionFieldInputsProps {
  fields: ActionField[];
  draft: ActionDraft;
  request: LocationCodeRequest;
}

/** The inputs an action asks for besides its note. */
export const ActionFieldInputs = ({
  fields,
  draft,
  request,
}: ActionFieldInputsProps) => {
  const { formatMessage } = useIntl();
  const showsGround =
    fields.includes("ground") ||
    (fields.includes("recommendation") && draft.recommendation === "reject");

  return (
    <>
      {fields.includes("assignedCode") && (
        <Alert severity="info">
          {formatMessage(
            { id: "rinf_lc_dialog_code_to_assign" },
            { code: request.assignableCode ?? "—" },
          )}
        </Alert>
      )}
      {fields.includes("recommendation") && (
        <TextField
          select
          size="small"
          label={formatMessage({ id: "rinf_lc_dialog_recommendation" })}
          value={draft.recommendation}
          onChange={(event) =>
            draft.setRecommendation(event.target.value as "assign" | "reject")
          }
        >
          <MenuItem value="assign">
            {formatMessage({ id: "rinf_lc_decision_assign" })}
          </MenuItem>
          <MenuItem value="reject">
            {formatMessage({ id: "rinf_lc_decision_reject" })}
          </MenuItem>
        </TextField>
      )}
      {showsGround && (
        <TextField
          select
          size="small"
          label={formatMessage({ id: "rinf_lc_dialog_ground" })}
          value={draft.ground}
          onChange={(event) =>
            draft.setGround(event.target.value as RejectionGround)
          }
          helperText={formatMessage({ id: "rinf_lc_dialog_ground_hint" })}
        >
          {REJECTION_GROUNDS.map((ground) => (
            <MenuItem key={ground} value={ground}>
              {formatMessage({ id: `rinf_lc_ground_${ground}` })}
            </MenuItem>
          ))}
        </TextField>
      )}
      {fields.includes("rinfLink") && (
        <RinfElementPicker
          value={draft.link}
          onChange={draft.setLink}
          label={formatMessage({ id: "rinf_lc_field_rinf" })}
        />
      )}
      {fields.includes("organisation") && (
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_dialog_organisation" })}
          value={draft.organisation}
          onChange={(event) => draft.setOrganisation(event.target.value)}
          helperText={formatMessage({ id: "rinf_lc_dialog_organisation_hint" })}
        />
      )}
    </>
  );
};
