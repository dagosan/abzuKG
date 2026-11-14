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

import { FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { Country, countryErrors } from "../model/masterData";
import { countryOfDraft, draftOfCountry } from "./countryDraft";
import { useEntryDraft } from "./hooks/useEntryDraft";
import { useSaveMasterData } from "./hooks/useSaveMasterData";
import { MasterDataDialog } from "./MasterDataDialog";
import { ValidityFields } from "./ValidityFields";

const ALREADY_LISTED = "rinf_lc_md_error_exists";
const ISO_CODE_LENGTH = 2;

interface CountryDialogProps {
  /** The country to change; null to add one. */
  country: Country | null;
  /** ISO codes already listed: a new country cannot take one. */
  listedCodes: string[];
  onClose: () => void;
}

/** Adds a country or changes one; the ISO code of a listed country is fixed. */
export const CountryDialog = ({
  country,
  listedCodes,
  onClose,
}: CountryDialogProps) => {
  const { formatMessage } = useIntl();
  const { draft, update, tried, markTried } = useEntryDraft(
    draftOfCountry(country),
  );
  const { busy, error, saveCountry } = useSaveMasterData();
  const edited = countryOfDraft(draft);
  const isNew = country === null;
  const problems = [
    ...countryErrors(edited),
    ...(isNew && listedCodes.includes(edited.isoCode) ? [ALREADY_LISTED] : []),
  ];

  const save = async () => {
    markTried();
    if (problems.length > 0) return;
    if (await saveCountry(edited)) onClose();
  };

  return (
    <MasterDataDialog
      title={formatMessage(
        { id: `rinf_lc_md_dialog_country_${isNew ? "add" : "edit"}` },
        { code: edited.isoCode },
      )}
      problems={[...(tried ? problems : []), ...(error ? [error] : [])]}
      busy={busy}
      onSave={save}
      onClose={onClose}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          fullWidth
          size="small"
          disabled={!isNew}
          label={formatMessage({ id: "rinf_lc_md_field_iso" })}
          value={draft.isoCode}
          onChange={(event) => update({ isoCode: event.target.value })}
          slotProps={{ htmlInput: { maxLength: ISO_CODE_LENGTH } }}
        />
        <TextField
          fullWidth
          size="small"
          label={formatMessage({ id: "rinf_lc_md_field_uic" })}
          helperText={formatMessage({ id: "rinf_lc_md_field_uic_hint" })}
          value={draft.uicCode}
          onChange={(event) => update({ uicCode: event.target.value })}
        />
      </Stack>
      <TextField
        size="small"
        label={formatMessage({ id: "rinf_lc_md_column_name" })}
        value={draft.name}
        onChange={(event) => update({ name: event.target.value })}
      />
      <FormControlLabel
        control={
          <Switch
            checked={draft.euMemberState}
            onChange={(event) =>
              update({ euMemberState: event.target.checked })
            }
          />
        }
        label={formatMessage({ id: "rinf_lc_md_field_eu" })}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          fullWidth
          size="small"
          label={formatMessage({ id: "rinf_lc_md_field_range_start" })}
          value={draft.plcRangeStart}
          onChange={(event) => update({ plcRangeStart: event.target.value })}
        />
        <TextField
          fullWidth
          size="small"
          label={formatMessage({ id: "rinf_lc_md_field_range_end" })}
          value={draft.plcRangeEnd}
          onChange={(event) => update({ plcRangeEnd: event.target.value })}
        />
      </Stack>
      <ValidityFields
        validFrom={draft.validFrom}
        validTo={draft.validTo}
        onChange={update}
      />
    </MasterDataDialog>
  );
};
