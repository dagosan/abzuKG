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

import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { IconButton, Tooltip } from "@mui/material";
import { useIntl } from "react-intl";
import { push } from "redux-first-history";
import { useConfirmLeave } from "../../components/modern/Shared/UnsavedChangesGuard";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PARAMETER_SEARCH_PATH } from "../parameterSearch/parameterSearchPath";

/**
 * Opens the search by parameter value — the last one if it is still open.
 * The header sits outside the router, so it navigates through the store.
 */
export const ParameterSearchButton = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const confirmLeave = useConfirmLeave();
  const searchPath = useAppSelector(
    (state) => state.rinf.parameterSearch.searchPath,
  );
  const label = formatMessage({ id: "rinf_parameter_search_open" });

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={() =>
          confirmLeave(() =>
            dispatch(push(searchPath ?? PARAMETER_SEARCH_PATH)),
          )
        }
        sx={{ ml: 0.5, color: "primary.contrastText" }}
      >
        <TuneOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};
