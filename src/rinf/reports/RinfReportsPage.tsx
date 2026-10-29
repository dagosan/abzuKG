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

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useState } from "react";
import { Helmet } from "react-helmet";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { belowAppChromeViewportHeight } from "../../components/modern/Header/headerMetrics";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { detailsPath } from "../detailsKinds";
import { isComplete } from "../models/parameterCriteria";
import type { PlaceMatch } from "../models/parameterMatches";
import { useParameterProfile } from "../parameterSearch/hooks/useParameterProfile";
import { useParameterSearchForm } from "../parameterSearch/hooks/useParameterSearchForm";
import { useRunSubmittedSearch } from "../parameterSearch/hooks/useRunSubmittedSearch";
import { ParameterSearchFormView } from "../parameterSearch/ParameterSearchFormView";
import { showResultsOnMap } from "../state/parameterSearchSlice";
import { useCellContext } from "./hooks/useCellContext";
import { useReportColumns } from "./hooks/useReportColumns";
import { useHeightToViewportBottom } from "./hooks/useHeightToViewportBottom";
import { useReportExport } from "./hooks/useReportExport";
import { useReportRows } from "./hooks/useReportRows";
import { FROM_REPORT_STATE } from "./reportNavigation";
import { ReportsActionBar } from "./ReportsActionBar";
import { ReportsFilterPanel } from "./ReportsFilterPanel";
import { ReportsFooter } from "./ReportsFooter";
import { ReportsStatus } from "./ReportsStatus";
import { ReportsTable } from "./ReportsTable";

/**
 * Route /rinf-reports — every section of line and OP holding an element
 * whose parameter meets a condition, as a table, laid out like Abzu's Reports.
 */
export const RinfReportsPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const form = useParameterSearchForm();
  const profile = useParameterProfile(form.draft);
  useRunSubmittedSearch(form.submitted);
  const resultsStatus = useAppSelector(
    (state) => state.rinf.parameterSearch.resultsStatus,
  );
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  // On a small screen the panel covers the table: closed when a search is
  // already in the address, and closed again once Search is pressed.
  const [filterPanelOpen, setFilterPanelOpen] = useState(
    () => !(isSmallScreen && isComplete(form.submitted)),
  );
  const submitAndShowResults = useCallback(() => {
    form.submit();
    if (isSmallScreen) setFilterPanelOpen(false);
  }, [form, isSmallScreen]);
  const columns = useReportColumns();
  const rows = useReportRows();
  const context = useCellContext();
  const exportCsv = useReportExport(
    rows.all,
    columns.visible,
    context,
    form.submitted.property,
  );

  const handleOpen = useCallback(
    ({ kind, canonicalId }: PlaceMatch) =>
      navigate(detailsPath(kind, canonicalId), { state: FROM_REPORT_STATE }),
    [navigate],
  );
  const handleShowOnMap = useCallback(() => {
    dispatch(showResultsOnMap());
    navigate("/");
  }, [dispatch, navigate]);
  const loaded = resultsStatus === "loaded";
  const page = useHeightToViewportBottom();

  return (
    <Box
      ref={page.ref}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: page.height ?? belowAppChromeViewportHeight,
        overflow: "hidden",
        bgcolor: "background.default",
        // Above the hidden map, whose attribution would otherwise show through.
        position: "relative",
        zIndex: 1,
      }}
    >
      <Helmet title={formatMessage({ id: "rinf_reports_tab" })} />
      <ReportsActionBar
        filterPanelOpen={filterPanelOpen}
        onToggleFilterPanel={() => setFilterPanelOpen((open) => !open)}
        columns={columns}
        resultCount={loaded ? rows.all.length : null}
        onShowOnMap={handleShowOnMap}
      />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <ReportsFilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
        >
          <ParameterSearchFormView
            form={{ ...form, submit: submitAndShowResults }}
            profile={profile}
          />
        </ReportsFilterPanel>
        <Box sx={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          <ReportsStatus />
          {loaded && (
            <ReportsTable
              rows={rows.page}
              columns={columns.visible}
              context={context}
              onOpen={handleOpen}
            />
          )}
        </Box>
      </Box>
      <ReportsFooter
        pageIndex={rows.pageIndex}
        pageCount={rows.pageCount}
        onPageChange={rows.setPageIndex}
        canExport={loaded && rows.all.length > 0}
        onExport={exportCsv}
      />
    </Box>
  );
};
