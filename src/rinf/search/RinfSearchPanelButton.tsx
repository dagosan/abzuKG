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
  Box,
  ClickAwayListener,
  IconButton,
  Paper,
  Tooltip,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import { headerSearchMobilePanel } from "../../components/modern/styles";
import { RinfSearchBox } from "./RinfSearchBox";

const PANEL_PADDING = 1.5;

/**
 * The RINF search in a narrow header: a search icon in the header that opens the
 * search box in a panel below it, as Abzu does for its stop place search.
 */
export const RinfSearchPanelButton = () => {
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const label = formatMessage({ id: "rinf_search_placeholder" });
  const close = () => setIsOpen(false);

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          color="inherit"
          aria-label={label}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
      {isOpen && (
        <ClickAwayListener onClickAway={close}>
          <Paper elevation={8} sx={headerSearchMobilePanel(theme, false)}>
            <Box sx={{ p: PANEL_PADDING }}>
              <RinfSearchBox onOpened={close} autoFocus />
            </Box>
          </Paper>
        </ClickAwayListener>
      )}
    </>
  );
};
