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

Added for the ERA RINF frontend, 2026-10-28. */

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField } from "@mui/material";
import { useIntl } from "react-intl";

interface ParameterFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/** Text box narrowing the panel's parameters by name, RINF index or value. */
export const ParameterFilter = ({ value, onChange }: ParameterFilterProps) => {
  const { formatMessage } = useIntl();
  const placeholder = formatMessage({ id: "rinf_filter_parameters" });
  return (
    <Box sx={{ px: 2, pb: 1.5 }}>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        slotProps={{
          htmlInput: { "aria-label": placeholder },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
