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

import FilterListIcon from "@mui/icons-material/FilterList";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useIntl } from "react-intl";
import { ColumnSelector } from "../../components/modern/ReportPage/components/ColumnSelector";
import type { ReportColumns } from "./hooks/useReportColumns";

/** Same height as Abzu's report action bar. */
const BAR_MIN_HEIGHT = 44;

interface ReportsActionBarProps {
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  columns: ReportColumns;
  /** Number of results, or null before a search has finished. */
  resultCount: number | null;
  onShowOnMap: () => void;
}

/** Below the header: filter panel toggle, columns, result count, "Show on map". */
export const ReportsActionBar = ({
  filterPanelOpen,
  onToggleFilterPanel,
  columns,
  resultCount,
  onShowOnMap,
}: ReportsActionBarProps) => {
  const { formatMessage } = useIntl();
  const filtersLabel = formatMessage({
    id: filterPanelOpen ? "close_filters" : "toggle_filters",
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
        minHeight: BAR_MIN_HEIGHT,
      }}
    >
      <Tooltip title={filtersLabel}>
        <IconButton
          size="small"
          aria-label={filtersLabel}
          onClick={onToggleFilterPanel}
          color={filterPanelOpen ? "primary" : "default"}
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <ColumnSelector
        columnOptions={columns.options}
        buttonLabel={formatMessage({ id: "rinf_reports_columns" })}
        captionLabel={formatMessage({ id: "rinf_reports_columns" })}
        onColumnToggle={columns.toggle}
        onCheckAll={columns.checkAll}
      />
      <Box sx={{ flexGrow: 1 }} />
      {resultCount !== null && (
        <Typography variant="caption" sx={{ pr: 1, color: "text.secondary" }}>
          {formatMessage(
            { id: "rinf_reports_result_count" },
            { count: resultCount },
          )}
        </Typography>
      )}
      <Button
        size="small"
        variant="contained"
        startIcon={<MapOutlinedIcon />}
        disabled={!resultCount}
        onClick={onShowOnMap}
      >
        {formatMessage({ id: "rinf_reports_show_on_map" })}
      </Button>
    </Box>
  );
};
