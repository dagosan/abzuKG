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
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";

/** Wider than Abzu's report filters (288 px): parameter names are long. */
const PANEL_WIDTH = 360;

interface ReportsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** The search, on the left: beside the table on wide screens, over it on small ones. */
export const ReportsFilterPanel = ({
  open,
  onClose,
  children,
}: ReportsFilterPanelProps) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const closeLabel = formatMessage({ id: "close" });

  const content = (
    <Box sx={{ width: PANEL_WIDTH, maxWidth: "100vw" }}>
      <Box
        sx={{ display: "flex", alignItems: "center", px: 2, pt: 1.5, pb: 1 }}
      >
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ flex: 1, fontWeight: 700, color: "primary.main" }}
        >
          {formatMessage({ id: "rinf_parameter_search_title" })}
        </Typography>
        <IconButton size="small" aria-label={closeLabel} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Box>
  );

  if (isSmallScreen) {
    return (
      <Drawer anchor="left" open={open} onClose={onClose}>
        {content}
      </Drawer>
    );
  }
  if (!open) return null;
  return (
    <Box
      sx={{
        flexShrink: 0,
        overflowY: "auto",
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {content}
    </Box>
  );
};
