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
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useIntl } from "react-intl";
import {
  ENTITLED_PARTIES,
  EntitledParty,
  SubsidiaryType,
  subsidiaryTypeErrors,
} from "../model/masterData";
import { useEntryDraft } from "./hooks/useEntryDraft";
import { useSaveMasterData } from "./hooks/useSaveMasterData";
import { MasterDataDialog } from "./MasterDataDialog";
import { ValidityFields } from "./ValidityFields";

const ALREADY_LISTED = "rinf_lc_md_error_exists";
const TYPE_CODE_LENGTH = 2;

const emptyType = (): SubsidiaryType => ({
  code: "",
  name: "",
  requesterRoles: [],
  retailRelated: false,
  validFrom: null,
  validTo: null,
});

interface SubsidiaryTypeDialogProps {
  /** The type to change; null to add one. */
  type: SubsidiaryType | null;
  /** Codes already listed: a new type cannot take one. */
  listedCodes: string[];
  onClose: () => void;
}

/** Adds a subsidiary type or changes one; the code of a listed type is fixed. */
export const SubsidiaryTypeDialog = ({
  type,
  listedCodes,
  onClose,
}: SubsidiaryTypeDialogProps) => {
  const { formatMessage } = useIntl();
  const { draft, update, tried, markTried } = useEntryDraft(
    type ?? emptyType(),
  );
  const { busy, error, saveSubsidiaryType } = useSaveMasterData();
  const isNew = type === null;
  const edited: SubsidiaryType = {
    ...draft,
    code: draft.code.trim(),
    name: draft.name.trim(),
  };
  const problems = [
    ...subsidiaryTypeErrors(edited),
    ...(isNew && listedCodes.includes(edited.code) ? [ALREADY_LISTED] : []),
  ];
  const toggleRole = (role: EntitledParty, checked: boolean) =>
    update({
      requesterRoles: ENTITLED_PARTIES.filter((party) =>
        party === role ? checked : draft.requesterRoles.includes(party),
      ),
    });

  const save = async () => {
    markTried();
    if (problems.length > 0) return;
    if (await saveSubsidiaryType(edited)) onClose();
  };

  return (
    <MasterDataDialog
      title={formatMessage(
        { id: `rinf_lc_md_dialog_type_${isNew ? "add" : "edit"}` },
        { code: edited.code },
      )}
      problems={[...(tried ? problems : []), ...(error ? [error] : [])]}
      busy={busy}
      onSave={save}
      onClose={onClose}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          size="small"
          disabled={!isNew}
          label={formatMessage({ id: "rinf_lc_md_field_code" })}
          value={draft.code}
          onChange={(event) => update({ code: event.target.value })}
          slotProps={{ htmlInput: { maxLength: TYPE_CODE_LENGTH } }}
        />
        <TextField
          fullWidth
          size="small"
          label={formatMessage({ id: "rinf_lc_md_column_name" })}
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
        />
      </Stack>
      <FormGroup>
        <FormLabel sx={{ typography: "body2" }}>
          {formatMessage({ id: "rinf_lc_md_field_requesters" })}
        </FormLabel>
        {ENTITLED_PARTIES.map((party) => (
          <FormControlLabel
            key={party}
            control={
              <Checkbox
                size="small"
                checked={draft.requesterRoles.includes(party)}
                onChange={(event) => toggleRole(party, event.target.checked)}
              />
            }
            label={formatMessage({ id: `rinf_lc_md_party_${party}` })}
          />
        ))}
      </FormGroup>
      <FormControlLabel
        control={
          <Switch
            checked={draft.retailRelated}
            onChange={(event) =>
              update({ retailRelated: event.target.checked })
            }
          />
        }
        label={formatMessage({ id: "rinf_lc_md_field_retail" })}
      />
      <ValidityFields
        validFrom={draft.validFrom ?? ""}
        validTo={draft.validTo ?? ""}
        onChange={({ validFrom, validTo }) =>
          update({
            ...(validFrom !== undefined && { validFrom: validFrom || null }),
            ...(validTo !== undefined && { validTo: validTo || null }),
          })
        }
      />
    </MasterDataDialog>
  );
};
