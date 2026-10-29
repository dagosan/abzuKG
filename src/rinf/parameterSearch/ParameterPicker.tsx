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
  Box,
  createFilterOptions,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../store/hooks";
import { localName } from "../models/labels";
import { compareByRinfIndex } from "../models/ParameterDictionary";

/** Options shown at once; typing narrows the rest. */
const VISIBLE_OPTIONS = 100;
const INDEX_WIDTH = 104;

interface ParameterOption {
  property: string;
  rinfIndex: string;
  label: string;
}

/** Matches the RINF number ("1.1.1.1.2.5") or any part of the name ("speed"). */
const filterOptions = createFilterOptions<ParameterOption>({
  stringify: (option) => `${option.rinfIndex} ${option.label}`,
  limit: VISIBLE_OPTIONS,
});

interface ParameterPickerProps {
  property: string;
  onChange: (property: string) => void;
}

/** Every RINF parameter of the ERA vocabulary, by RINF number or name. */
export const ParameterPicker = ({
  property,
  onChange,
}: ParameterPickerProps) => {
  const { formatMessage } = useIntl();
  const { entries, status } = useAppSelector(
    (state) => state.rinf.parameterDictionary,
  );
  const options = useMemo(
    () =>
      Object.entries(entries)
        .filter(([, term]) => term.rinfIndex)
        .sort(([, first], [, second]) => compareByRinfIndex(first, second))
        .map(([uri, term]) => ({
          property: localName(uri),
          rinfIndex: term.rinfIndex!,
          label: term.label,
        })),
    [entries],
  );
  const selected =
    options.find((option) => option.property === property) ?? null;
  const label = formatMessage({ id: "rinf_parameter_search_parameter" });

  return (
    <Autocomplete<ParameterOption>
      options={options}
      value={selected}
      loading={status === "loading"}
      filterOptions={filterOptions}
      getOptionLabel={(option) => `${option.rinfIndex} ${option.label}`}
      isOptionEqualToValue={(option, value) =>
        option.property === value.property
      }
      onChange={(_event, option) => onChange(option?.property ?? "")}
      renderOption={(props, option) => (
        <li {...props} key={option.property}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                flex: `0 0 ${INDEX_WIDTH}px`,
                fontFamily: "monospace",
                color: "text.secondary",
                pt: 0.25,
              }}
            >
              {option.rinfIndex}
            </Typography>
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={formatMessage({
            id: "rinf_parameter_search_parameter_placeholder",
          })}
        />
      )}
    />
  );
};
