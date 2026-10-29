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

import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { isCreation } from "../model/codeTypes";
import { COUNTRY_PREFIXES, countryName } from "../model/countries";
import { FieldRow } from "./FieldRow";
import { useFieldError } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface PrimaryCodeFieldsProps {
  form: RequestForm;
}

/** A PLC: country, value, name and IM (or the code to change). */
export const PrimaryCodeFields = ({ form }: PrimaryCodeFieldsProps) => {
  const { formatMessage, locale } = useIntl();
  const { data, update, errors } = form;
  const fieldError = useFieldError(errors, form.fromRinf);
  const creating = isCreation(data.operation);
  const amending = data.operation === "amendment";
  const optionalSuffix = amending ? "_optional" : "";

  return (
    <>
      <FieldRow>
        {creating ? (
          <TextField
            select
            size="small"
            label={formatMessage({ id: "rinf_lc_field_country" })}
            value={data.country}
            onChange={(event) => update({ country: event.target.value })}
            {...fieldError("country")}
          >
            {COUNTRY_PREFIXES.map((prefix) => (
              <MenuItem key={prefix} value={prefix}>
                {prefix} · {countryName(prefix, locale)}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            size="small"
            label={formatMessage({ id: "rinf_lc_field_target_primary" })}
            value={data.targetCode}
            onChange={(event) =>
              update({ targetCode: event.target.value.toUpperCase() })
            }
            {...fieldError("targetCode", "rinf_lc_field_primary_code_hint")}
          />
        )}
        {creating && (
          <TextField
            size="small"
            label={formatMessage({
              id:
                data.operation === "existingCode"
                  ? "rinf_lc_field_existing_code"
                  : "rinf_lc_field_proposed_code",
            })}
            value={data.proposedCode}
            onChange={(event) =>
              update({ proposedCode: event.target.value.toUpperCase() })
            }
            {...fieldError("proposedCode", "rinf_lc_field_proposed_code_hint")}
          />
        )}
      </FieldRow>
      {data.operation !== "deactivation" && (
        <FieldRow>
          <TextField
            size="small"
            label={formatMessage({ id: `rinf_lc_field_name${optionalSuffix}` })}
            value={data.locationName}
            onChange={(event) => update({ locationName: event.target.value })}
            {...fieldError("locationName", "rinf_lc_field_name_hint")}
          />
          <TextField
            size="small"
            label={formatMessage({ id: `rinf_lc_field_im${optionalSuffix}` })}
            value={data.imOrganisationCode}
            onChange={(event) =>
              update({ imOrganisationCode: event.target.value.toUpperCase() })
            }
            {...fieldError("imOrganisationCode", "rinf_lc_field_im_hint")}
          />
        </FieldRow>
      )}
      {creating && (
        <FormControlLabel
          control={
            <Checkbox
              checked={data.legacyCodingRange}
              onChange={(event) =>
                update({ legacyCodingRange: event.target.checked })
              }
            />
          }
          label={formatMessage({ id: "rinf_lc_field_legacy_range" })}
        />
      )}
    </>
  );
};
