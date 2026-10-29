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

import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  useTheme,
} from "@mui/material";
import type { KeyboardEvent } from "react";
import { useIntl } from "react-intl";
import { searchFieldSx } from "../../components/modern/styles";
import type { DetailsKind } from "../detailsKinds";
import { RinfSearchResult, searchResultKey } from "../models/RinfSearchResult";
import { RinfSearch, useRinfSearch } from "./hooks/useRinfSearch";
import { SearchResultOption } from "./SearchResultOption";

const LIST_MAX_WIDTH = { xs: "calc(100vw - 32px)", sm: "460px" };
const BOX_MAX_WIDTH = 480;
const SPINNER_SIZE = 16;
/** Heading of each group in the list. */
const GROUP_LABEL_IDS: Record<DetailsKind, string> = {
  operationalPoint: "rinf_search_group_operational_points",
  sectionOfLine: "rinf_search_group_sections_of_line",
};

type MuiKeyboardEvent = KeyboardEvent & { defaultMuiPrevented?: boolean };

/** Which hint the empty dropdown shows, from the search's state. */
const emptyListMessageId = (search: RinfSearch): string => {
  if (search.isTooShort) return "rinf_search_too_short";
  if (search.isStale || search.status === "idle")
    return "rinf_search_press_enter";
  if (search.status === "failed") return "rinf_search_failed";
  return "rinf_search_no_results";
};

interface RinfSearchBoxProps {
  /** Called once a chosen result has been opened (e.g. to close a panel). */
  onOpened?: () => void;
  autoFocus?: boolean;
}

/** Header search for RINF OPs and sections of line; Enter searches, a result opens its panel. */
export const RinfSearchBox = ({
  onOpened,
  autoFocus = false,
}: RinfSearchBoxProps) => {
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const search = useRinfSearch();
  const { text, setText, submit, open, status, results, isStale } = search;
  const loading = status === "loading";
  const options = isStale || loading ? [] : results;
  const placeholder = formatMessage({ id: "rinf_search_placeholder" });

  const handleKeyDown = (event: MuiKeyboardEvent) => {
    if (event.key !== "Enter" || options.length > 0) return;
    // Nothing to pick yet: Enter starts the search instead.
    event.defaultMuiPrevented = true;
    submit();
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, maxWidth: BOX_MAX_WIDTH }}>
      <Autocomplete<RinfSearchResult>
        options={options}
        value={null}
        inputValue={text}
        autoHighlight
        loading={loading}
        filterOptions={(all) => all}
        getOptionLabel={(option) => option.name}
        groupBy={(option) =>
          formatMessage({ id: GROUP_LABEL_IDS[option.kind] })
        }
        isOptionEqualToValue={(option, value) =>
          searchResultKey(option) === searchResultKey(value)
        }
        onInputChange={(_event, value, reason) => {
          if (reason === "input" || reason === "clear") setText(value);
        }}
        onChange={(_event, result) => {
          if (!result) return;
          open(result);
          onOpened?.();
        }}
        onKeyDown={handleKeyDown}
        noOptionsText={formatMessage({ id: emptyListMessageId(search) })}
        loadingText={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={SPINNER_SIZE} />
            {formatMessage({ id: "rinf_search_searching" })}
          </Box>
        }
        renderOption={(props, option) => (
          <li {...props} key={searchResultKey(option)}>
            <SearchResultOption result={option} />
          </li>
        )}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              mt: 1,
              maxHeight: "80vh",
              overflow: "auto",
              maxWidth: LIST_MAX_WIDTH,
            },
          },
          popper: {
            placement: "bottom-start",
            sx: { zIndex: theme.zIndex.modal + 10, maxWidth: LIST_MAX_WIDTH },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            autoFocus={autoFocus}
            placeholder={placeholder}
            sx={searchFieldSx(theme)}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                "aria-label": placeholder,
              },
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />
    </Box>
  );
};
