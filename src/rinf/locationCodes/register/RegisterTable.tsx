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

Added for the ERA RINF frontend, 2026-11-02.
Modified 2026-11-02: register as code versions with CRD's columns. */

import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useAppSelector } from "../../../store/hooks";
import { todayIsoDate } from "../../api/queryParts";
import { downloadCsv } from "../../reports/csv";
import { crdCsv } from "./crdExport";
import { useRegisterRows } from "./hooks/useRegisterRows";
import { RegisterRow } from "./RegisterRow";

const FILTER_WIDTH = 320;
const CRD_FILE_PREFIX = "location-codes-crd-";
const COLUMN_IDS = [
  "code",
  "type",
  "valid",
  "status",
  "name",
  "im_or_type",
  "use",
  "nuts",
  "position",
  "rinf",
  "requests",
];

/**
 * The codes this workflow recorded, one row per version as in CRD: a new
 * name, IM or use starts a new version. Downloadable in CRD's CSV format.
 */
export const RegisterTable = () => {
  const { formatMessage } = useIntl();
  const versions = useAppSelector((state) => state.rinf.locationCodes.codes);
  const [filter, setFilter] = useState("");
  const [withEarlierVersions, setWithEarlierVersions] = useState(true);
  const { rows, codeCount } = useRegisterRows(
    versions,
    filter,
    withEarlierVersions,
  );
  const today = todayIsoDate();
  const downloadCrd = () =>
    downloadCsv(
      `${CRD_FILE_PREFIX}${today}.csv`,
      crdCsv(versions, today),
      false,
    );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" component="h2">
        {formatMessage({ id: "rinf_lc_register_title" })}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {formatMessage({ id: "rinf_lc_register_hint" })}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2, alignItems: { sm: "center" } }}
      >
        <TextField
          size="small"
          label={formatMessage({ id: "rinf_lc_register_filter" })}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          sx={{ width: { xs: "100%", sm: FILTER_WIDTH } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={withEarlierVersions}
              onChange={(event) => setWithEarlierVersions(event.target.checked)}
            />
          }
          label={formatMessage({ id: "rinf_lc_register_earlier_versions" })}
        />
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={downloadCrd}
          disabled={codeCount === 0}
        >
          {formatMessage({ id: "rinf_lc_register_download_crd" })}
        </Button>
      </Stack>
      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatMessage({ id: "rinf_lc_register_empty" })}
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ bgcolor: "background.paper" }}>
            <TableHead>
              <TableRow>
                {COLUMN_IDS.map((column) => (
                  <TableCell key={column}>
                    {formatMessage({ id: `rinf_lc_register_column_${column}` })}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((version) => (
                <RegisterRow
                  key={`${version.key}#${version.version}`}
                  version={version}
                  today={today}
                />
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};
