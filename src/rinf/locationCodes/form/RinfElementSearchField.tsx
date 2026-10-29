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

import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { KeyboardEvent, useState } from "react";
import { useIntl } from "react-intl";
import type { RinfSearchResult } from "../../models/RinfSearchResult";
import { searchResultKey } from "../../models/RinfSearchResult";
import { SearchResultOption } from "../../search/SearchResultOption";
import type { RinfLink } from "../model/LocationCodeRequest";
import { elementLink } from "../model/rinfLink";
import { useRinfElementSearch } from "./hooks/useRinfElementSearch";

const SPINNER_SIZE = 16;
const FIELD_MIN_WIDTH = 240;

type MuiKeyboardEvent = KeyboardEvent & { defaultMuiPrevented?: boolean };

interface RinfElementSearchFieldProps {
  label: string;
  error?: boolean;
  onPick: (link: RinfLink) => void;
}

/** Finds an OP or section of line by name, UOPID or line number, on Enter. */
export const RinfElementSearchField = ({
  label,
  error,
  onPick,
}: RinfElementSearchFieldProps) => {
  const { formatMessage } = useIntl();
  const { status, results, search } = useRinfElementSearch();
  const [text, setText] = useState("");
  const loading = status === "loading";

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
      onChange={(_event, result) =>
        result &&
        onPick(elementLink(result.kind, result.canonicalId, result.name))
      }
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
      sx={{ flex: 1, minWidth: FIELD_MIN_WIDTH }}
      renderInput={(params) => (
        <TextField {...params} size="small" label={label} error={error} />
      )}
    />
  );
};
