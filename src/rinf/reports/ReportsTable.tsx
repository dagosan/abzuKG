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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import type { KeyboardEvent } from "react";
import { useIntl } from "react-intl";
import type { PlaceMatch } from "../models/parameterMatches";
import {
  CellContext,
  cellValue,
  columnLabelId,
  ReportColumnId,
} from "./reportColumns";

interface ReportsTableProps {
  rows: PlaceMatch[];
  columns: ReportColumnId[];
  context: CellContext;
  onOpen: (place: PlaceMatch) => void;
}

/** One row per matching section of line or OP; a row opens its details beside the map. */
export const ReportsTable = ({
  rows,
  columns,
  context,
  onOpen,
}: ReportsTableProps) => {
  const { formatMessage } = useIntl();
  if (rows.length === 0) return null;

  const openOnEnter = (event: KeyboardEvent, place: PlaceMatch) => {
    if (event.key === "Enter") onOpen(place);
  };

  return (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column} sx={{ fontWeight: 700 }}>
              {formatMessage({ id: columnLabelId(column) })}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((place) => (
          <TableRow
            key={`${place.kind}:${place.canonicalId}`}
            hover
            tabIndex={0}
            onClick={() => onOpen(place)}
            onKeyDown={(event) => openOnEnter(event, place)}
            sx={{ cursor: "pointer" }}
          >
            {columns.map((column) => (
              <TableCell
                key={column}
                sx={column === "rinfName" ? { fontWeight: 600 } : undefined}
              >
                {cellValue(column, place, context)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
