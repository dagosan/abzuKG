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

Added for the ERA Location Code Manager, 2026-11-10. */

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";
import { CODE_TYPE_ABBREVIATIONS } from "../../model/codeTypes";
import type { LocationCodeRequest } from "../../model/LocationCodeRequest";
import { requestPath } from "../../page/locationCodesPath";
import { StatusChip } from "../../page/StatusChip";
import { checksToRead } from "../bulkBatch";

const COLUMN_IDS = [
  "line",
  "reference",
  "kind",
  "name",
  "code",
  "checks",
  "status",
].map((column) => `rinf_lc_bulk_lines_${column}`);
const NONE = "—";

/** The code decided, else the one the checks found assignable, else the one proposed. */
const codeOf = (line: LocationCodeRequest): string =>
  line.decision?.code || line.assignableCode || line.data.proposedCode || NONE;

interface BulkLinesTableProps {
  lines: LocationCodeRequest[];
}

/** The lines of a bulk request: where each stands, and the way into its own file. */
export const BulkLinesTable = ({ lines }: BulkLinesTableProps) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        sx={{
          bgcolor: "background.paper",
          "& td, & th": { whiteSpace: "nowrap" },
        }}
      >
        <TableHead>
          <TableRow>
            {COLUMN_IDS.map((columnId) => (
              <TableCell key={columnId}>
                {formatMessage({ id: columnId })}
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id} hover>
              <TableCell>{line.bulk?.line}</TableCell>
              <TableCell>{line.reference ?? NONE}</TableCell>
              <TableCell>
                {CODE_TYPE_ABBREVIATIONS[line.data.codeType]}
              </TableCell>
              <TableCell>{line.data.locationName || NONE}</TableCell>
              <TableCell>{codeOf(line)}</TableCell>
              <TableCell>
                {line.checksRunAt
                  ? formatMessage({
                      id: `rinf_lc_bulk_checks_${checksToRead(line)}`,
                    })
                  : NONE}
              </TableCell>
              <TableCell>
                <StatusChip status={line.status} />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() => navigate(requestPath(line.id))}
                >
                  {formatMessage({ id: "rinf_lc_bulk_lines_open" })}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
