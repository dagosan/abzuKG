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

import {
  Box,
  CircularProgress,
  Drawer,
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
import { DetailsKind, DETAILS_KINDS } from "../detailsKinds";
import { DetailsContent } from "./DetailsContent";
import { DetailsHeader } from "./DetailsHeader";
import { ParameterFilter } from "./ParameterFilter";
import {
  DRAWER_WIDTH_DESKTOP,
  DRAWER_WIDTH_MOBILE,
  DRAWER_WIDTH_TABLET,
} from "./panelWidth";

const FAILED_MESSAGE_ID = "rinf_details_failed";

interface DetailsPanelProps {
  kind: DetailsKind;
  canonicalId: string;
  name: string;
  onClose: () => void;
}

/** Left-hand panel listing every parameter of the open SoL or OP and its parts. */
export const DetailsPanel = ({
  kind,
  canonicalId,
  name,
  onClose,
}: DetailsPanelProps) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [filter, setFilter] = useState("");
  const { status, roots } = useAppSelector((state) => state.rinf.details);
  const { titleId, notFoundId } = DETAILS_KINDS[kind];
  const drawerWidth = isMobile
    ? DRAWER_WIDTH_MOBILE
    : isTablet
      ? DRAWER_WIDTH_TABLET
      : DRAWER_WIDTH_DESKTOP;
  const errorMessageId =
    status === "failed"
      ? FAILED_MESSAGE_ID
      : status === "notFound"
        ? notFoundId
        : null;

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
      <DetailsHeader
        titleId={titleId}
        name={name}
        canonicalId={canonicalId}
        onClose={onClose}
      />
      <ParameterFilter value={filter} onChange={setFilter} />
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {status === "loading" && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress
              aria-label={formatMessage({ id: "rinf_loading_details" })}
            />
          </Box>
        )}
        {errorMessageId && (
          <Typography variant="body2" sx={{ p: 2, color: "error.main" }}>
            {formatMessage({ id: errorMessageId })}
          </Typography>
        )}
        {status === "loaded" && (
          <DetailsContent
            key={`${kind}/${canonicalId}`}
            kind={kind}
            roots={roots}
            filter={filter}
          />
        )}
      </Box>
    </Drawer>
  );
};
