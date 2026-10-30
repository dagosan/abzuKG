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
limitations under the Licence. */

/* Modified for the ERA RINF frontend, 2026-10-29: added the RINF reports and location codes tabs; separator no longer adds to the strip's height. 2026-10-30: only the tabs of this deployment's tool (rinfTool). */

import { Map, Report } from "@mui/icons-material";
import { alpha, Box, Tab, Tabs } from "@mui/material";
import React from "react";
import { useIntl } from "react-intl";
import AppRoutes from "../../../../routes";
import { useAppSelector } from "../../../../store/hooks";
import { NAVIGATION_LINE_HEIGHT } from "../headerMetrics";
import { navigationPillSx } from "./navigationPillSx";
import { NavigationUiModeSwitch } from "./NavigationUiModeSwitch";
import { useGoToRinfReports } from "../../../../rinf/reports/hooks/useGoToRinfReports";
import { isRinfReportsPath } from "../../../../rinf/reports/rinfReportsPath";
import {
  RINF_REPORTS_TAB,
  RinfReportsTab,
} from "../../../../rinf/reports/RinfReportsTab";
import { useRinfTool } from "../../../../rinf/config/rinfTool";
import { useGoToLocationCodes } from "../../../../rinf/locationCodes/page/hooks/useGoToLocationCodes";
import { isLocationCodesPath } from "../../../../rinf/locationCodes/page/locationCodesPath";
import {
  LOCATION_CODES_TAB,
  LocationCodesTab,
} from "../../../../rinf/locationCodes/page/LocationCodesTab";

const MAIN_TAB = "main";
const REPORTS_TAB = "reports";

const SEPARATOR_OPACITY = 0.15;
const SELECTED_TAB_OPACITY = 0.16;

interface NavigationLineProps {
  onReturnToMap: () => void;
  onNavigateToReports: () => void;
}

/**
 * The application's primary navigation, as a tab strip under the header.
 *
 * Only real in-app destinations belong here. The user guide was briefly a tab,
 * but it is a link out to the Confluence wiki — a tab that silently leaves the
 * application is an action whose consequence is invisible until you take it.
 * It lives under the help control instead, with the deployment's other
 * reference links. An in-app help page would earn a tab here; a link out does
 * not.
 */
export const NavigationLine: React.FC<NavigationLineProps> = ({
  onReturnToMap,
  onNavigateToReports,
}) => {
  const { formatMessage } = useIntl();
  const pathname = useAppSelector(
    (state: any) => state.router.location.pathname,
  );

  // Editor routes sit on top of the map, so they keep the map tab lit rather
  // than leaving the strip with nothing selected.
  const goToRinfReports = useGoToRinfReports();
  const goToLocationCodes = useGoToLocationCodes();
  const { rinfReports, locationCodes } = useRinfTool();
  const activeTab =
    pathname === `/${AppRoutes.REPORTS}`
      ? REPORTS_TAB
      : isRinfReportsPath(pathname)
        ? RINF_REPORTS_TAB
        : isLocationCodesPath(pathname)
          ? LOCATION_CODES_TAB
          : MAIN_TAB;

  const handleTabChange = (
    _event: React.SyntheticEvent,
    nextTab: string,
  ): void => {
    if (nextTab === REPORTS_TAB) {
      onNavigateToReports();
      return;
    }
    if (nextTab === RINF_REPORTS_TAB) {
      goToRinfReports();
      return;
    }
    if (nextTab === LOCATION_CODES_TAB) {
      goToLocationCodes();
      return;
    }
    onReturnToMap();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: { xs: 1, sm: 2 },
        // An inset shadow, not a border: a 1 px border made the strip 41 px,
        // one more than NAVIGATION_LINE_HEIGHT.
        boxShadow: (theme) =>
          `inset 0 1px 0 ${alpha(theme.palette.primary.contrastText, SEPARATOR_OPACITY)}`,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons={false}
        aria-label={formatMessage({ id: "navigation" })}
        sx={{
          flex: 1,
          minHeight: NAVIGATION_LINE_HEIGHT,
          /* No underline. MUI pins the indicator to the bottom of the strip,
             which is the bottom of the AppBar — exactly where the editor drawer
             is docked, so it read as the panel's own border. The entity tab
             strip inside the panel already owns the underline affordance; app
             navigation uses a pill so the two can't be confused either. */
          "& .MuiTabs-indicator": {
            display: "none",
          },
          "& .MuiTab-root": {
            ...navigationPillSx,
            "&.Mui-selected": {
              color: "primary.contrastText",
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.contrastText, SELECTED_TAB_OPACITY),
            },
          },
        }}
      >
        <Tab
          value={MAIN_TAB}
          icon={<Map fontSize="small" />}
          iconPosition="start"
          label={formatMessage({ id: "navigation_map" })}
        />
        <Tab
          value={REPORTS_TAB}
          icon={<Report fontSize="small" />}
          iconPosition="start"
          label={formatMessage({ id: "report_site" })}
        />
        {rinfReports && <RinfReportsTab value={RINF_REPORTS_TAB} />}
        {locationCodes && <LocationCodesTab value={LOCATION_CODES_TAB} />}
      </Tabs>
      <NavigationUiModeSwitch />
    </Box>
  );
};
