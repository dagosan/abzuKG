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

import { useCallback } from "react";
import { useIntl } from "react-intl";
import { todayIsoDate } from "../../api/queryParts";
import type { PlaceMatch } from "../../models/parameterMatches";
import { downloadCsv, toCsv } from "../csv";
import {
  CellContext,
  cellValue,
  columnLabelId,
  ReportColumnId,
} from "../reportColumns";

const FILE_PREFIX = "rinf-report";

/** Exports every result (not only the page shown), with the visible columns. */
export const useReportExport = (
  places: PlaceMatch[],
  columns: ReportColumnId[],
  context: CellContext,
  property: string,
): (() => void) => {
  const { formatMessage } = useIntl();
  return useCallback(() => {
    const header = columns.map((column) =>
      formatMessage({ id: columnLabelId(column) }),
    );
    const rows = places.map((place) =>
      columns.map((column) => cellValue(column, place, context)),
    );
    downloadCsv(
      `${FILE_PREFIX}-${property}-${todayIsoDate()}.csv`,
      toCsv(header, rows),
    );
  }, [columns, context, formatMessage, places, property]);
};
