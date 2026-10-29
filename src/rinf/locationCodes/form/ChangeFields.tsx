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

import { Checkbox, FormControlLabel, TextField } from "@mui/material";
import { useIntl } from "react-intl";
import { isCreation } from "../model/codeTypes";
import { useFieldError } from "./FormSection";
import type { RequestForm } from "./hooks/useRequestForm";

interface ChangeFieldsProps {
  form: RequestForm;
}

/** Amendment and deactivation: when it takes effect; closing dependants. */
export const ChangeFields = ({ form }: ChangeFieldsProps) => {
  const { formatMessage } = useIntl();
  const { data, update, errors } = form;
  const fieldError = useFieldError(errors);
  if (isCreation(data.operation)) return null;
  const closesPrimary =
    data.operation === "deactivation" && data.codeType === "primary";

  return (
    <>
      <TextField
        size="small"
        type="date"
        label={formatMessage({ id: "rinf_lc_field_effective_date" })}
        value={data.effectiveDate}
        onChange={(event) => update({ effectiveDate: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        {...fieldError("effectiveDate", "rinf_lc_field_effective_date_hint")}
      />
      {closesPrimary && (
        <FormControlLabel
          control={
            <Checkbox
              checked={data.closeDependentCodes}
              onChange={(event) =>
                update({ closeDependentCodes: event.target.checked })
              }
            />
          }
          label={formatMessage({ id: "rinf_lc_field_close_dependants" })}
        />
      )}
    </>
  );
};
