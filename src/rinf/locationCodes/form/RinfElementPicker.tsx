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

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { KeyboardEvent, useState } from "react";
import { useIntl } from "react-intl";
import { Link as RouterLink } from "react-router-dom";
import { detailsPath } from "../../detailsKinds";
import type { RinfSearchResult } from "../../models/RinfSearchResult";
import { searchResultKey } from "../../models/RinfSearchResult";
import { SearchResultOption } from "../../search/SearchResultOption";
import type { RinfLink } from "../model/LocationCodeRequest";
import { useRinfElementSearch } from "./hooks/useRinfElementSearch";

const SPINNER_SIZE = 16;

type MuiKeyboardEvent = KeyboardEvent & { defaultMuiPrevented?: boolean };

interface RinfElementPickerProps {
  value: RinfLink | null;
  onChange: (link: RinfLink | null) => void;
  label: string;
  helperText?: string;
  error?: boolean;
}

const toLink = (result: RinfSearchResult): RinfLink => ({
  kind: result.kind,
  canonicalId: result.canonicalId,
  label: result.name,
});

/** Picks the RINF OP or section of line a code is positioned on (8.6). */
export const RinfElementPicker = ({
  value,
  onChange,
  label,
  helperText,
  error,
}: RinfElementPickerProps) => {
  const { formatMessage } = useIntl();
  const { status, results, search } = useRinfElementSearch();
  const [text, setText] = useState("");
  const loading = status === "loading";

  if (value) {
    return (
      <Box>
        <Typography
          variant="caption"
          component="div"
          sx={{ color: "text.secondary", mb: 0.5 }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`${value.label} · ${value.canonicalId}`}
            onDelete={() => onChange(null)}
            color="primary"
            variant="outlined"
          />
          <Tooltip title={formatMessage({ id: "rinf_lc_open_in_rinf" })}>
            <IconButton
              size="small"
              component={RouterLink}
              to={detailsPath(value.kind, value.canonicalId)}
              target="_blank"
              aria-label={formatMessage({ id: "rinf_lc_open_in_rinf" })}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  const handleKeyDown = (event: MuiKeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.defaultMuiPrevented = true;
    event.preventDefault();
    search(text);
  };

  return (
    <Autocomplete<RinfSearchResult>
      options={loading ? [] : results}
      value={null}
      inputValue={text}
      loading={loading}
      filterOptions={(all) => all}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, other) =>
        searchResultKey(option) === searchResultKey(other)
      }
      onInputChange={(_event, next, reason) =>
        reason === "input" && setText(next)
      }
      onChange={(_event, result) => result && onChange(toLink(result))}
      onKeyDown={handleKeyDown}
      noOptionsText={formatMessage({
        id:
          status === "idle"
            ? "rinf_search_press_enter"
            : "rinf_search_no_results",
      })}
      loadingText={<CircularProgress size={SPINNER_SIZE} />}
      renderOption={(props, option) => (
        <li {...props} key={searchResultKey(option)}>
          <SearchResultOption result={option} />
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          error={error}
          helperText={
            helperText ?? formatMessage({ id: "rinf_lc_rinf_picker_hint" })
          }
        />
      )}
    />
  );
};
