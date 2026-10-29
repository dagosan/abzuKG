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
  Autocomplete,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { localName } from "../models/labels";
import type { ValueInUse, ValueKind } from "../models/parameterValues";

interface ValueInputProps {
  kind: ValueKind;
  value: string;
  values: ValueInUse[];
  loading: boolean;
  unit: string | null;
  onChange: (value: string) => void;
}

const codeLabel = (option: ValueInUse): string =>
  option.label ?? localName(option.value);

/** A code from those in use, a number with its unit, or text — by the parameter's kind. */
export const ValueInput = ({
  kind,
  value,
  values,
  loading,
  unit,
  onChange,
}: ValueInputProps) => {
  const { formatMessage } = useIntl();
  const label = formatMessage({ id: "rinf_parameter_search_value" });

  if (kind === "code") {
    const codes = values.filter((option) => option.isCode);
    return (
      <Autocomplete<ValueInUse>
        options={codes}
        loading={loading}
        value={codes.find((option) => option.value === value) ?? null}
        getOptionLabel={codeLabel}
        isOptionEqualToValue={(option, chosen) => option.value === chosen.value}
        onChange={(_event, option) => onChange(option?.value ?? "")}
        noOptionsText={formatMessage({ id: "rinf_parameter_search_no_values" })}
        renderOption={(props, option) => (
          <li {...props} key={option.value}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {codeLabel(option)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatMessage(
                { id: "rinf_parameter_search_uses" },
                { count: option.uses },
              )}
            </Typography>
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} size="small" label={label} />
        )}
      />
    );
  }

  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: { inputMode: kind === "number" ? "decimal" : "text" },
        input: unit
          ? {
              endAdornment: (
                <InputAdornment position="end">{unit}</InputAdornment>
              ),
            }
          : undefined,
      }}
    />
  );
};
