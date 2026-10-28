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
import {
  Box,
  CircularProgress,
  Drawer,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useIntl } from "react-intl";
import {
  appChromeTop,
  belowAppChromeHeight,
} from "../../components/modern/Header/headerMetrics";
import { useAppSelector } from "../../store/hooks";
import { SectionOfLineContent } from "./SectionOfLineContent";
import { SectionOfLineHeader } from "./SectionOfLineHeader";

/** Same widths as Abzu's stop place panel, so both sit alike beside the map. */
const DRAWER_WIDTH_DESKTOP = 450;
const DRAWER_WIDTH_TABLET = 380;
const DRAWER_WIDTH_MOBILE = "100%";

const STATUS_MESSAGES: Record<string, string> = {
  failed: "rinf_section_of_line_failed",
  notFound: "rinf_section_of_line_not_found",
};

interface SectionOfLinePanelProps {
  canonicalId: string;
  name: string;
  onClose: () => void;
}

/** Left-hand panel listing every parameter of the open SoL and its tracks. */
export const SectionOfLinePanel = ({
  canonicalId,
  name,
  onClose,
}: SectionOfLinePanelProps) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [filter, setFilter] = useState("");
  const { status, details } = useAppSelector(
    (state) => state.rinf.sectionOfLineDetails,
  );
  const drawerWidth = isMobile
    ? DRAWER_WIDTH_MOBILE
    : isTablet
      ? DRAWER_WIDTH_TABLET
      : DRAWER_WIDTH_DESKTOP;
  const statusMessage = STATUS_MESSAGES[status];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          top: appChromeTop,
          height: belowAppChromeHeight,
        },
      }}
    >
      <SectionOfLineHeader
        name={name}
        canonicalId={canonicalId}
        onClose={onClose}
      />
      <Box sx={{ px: 2, pb: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={formatMessage({ id: "rinf_filter_parameters" })}
          slotProps={{
            htmlInput: {
              "aria-label": formatMessage({ id: "rinf_filter_parameters" }),
            },
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
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {status === "loading" && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress
              aria-label={formatMessage({ id: "rinf_loading_section_of_line" })}
            />
          </Box>
        )}
        {statusMessage && (
          <Typography variant="body2" sx={{ p: 2, color: "error.main" }}>
            {formatMessage({ id: statusMessage })}
          </Typography>
        )}
        {status === "loaded" && details && (
          <SectionOfLineContent
            key={details.uri}
            details={details}
            filter={filter}
          />
        )}
      </Box>
    </Drawer>
  );
};
