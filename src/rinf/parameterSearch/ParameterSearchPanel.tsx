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

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";
import {
  appChromeTop,
  belowAppChromeHeight,
} from "../../components/modern/Header/headerMetrics";
import {
  DRAWER_WIDTH_DESKTOP,
  DRAWER_WIDTH_MOBILE,
  DRAWER_WIDTH_TABLET,
} from "../panel/panelWidth";

interface ParameterSearchPanelProps {
  form: ReactNode;
  results: ReactNode;
  onClose: () => void;
}

/** Left-hand panel, placed like the details panel: the form, then the results. */
export const ParameterSearchPanel = ({
  form,
  results,
  onClose,
}: ParameterSearchPanelProps) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const drawerWidth = isMobile
    ? DRAWER_WIDTH_MOBILE
    : isTablet
      ? DRAWER_WIDTH_TABLET
      : DRAWER_WIDTH_DESKTOP;
  const closeLabel = formatMessage({ id: "close" });

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
      <Box sx={{ display: "flex", alignItems: "center", p: 2, pb: 1 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{ flex: 1, color: "primary.main", fontWeight: 700 }}
        >
          {formatMessage({ id: "rinf_parameter_search_title" })}
        </Typography>
        <Tooltip title={closeLabel}>
          <IconButton onClick={onClose} aria-label={closeLabel}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {form}
        <Divider />
        {results}
      </Box>
    </Drawer>
  );
};
