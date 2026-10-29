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

import { useCallback, useState } from "react";
import type { ColumnOption } from "../../../components/modern/ReportPage/types";
import { REPORT_COLUMN_IDS, ReportColumnId } from "../reportColumns";

export interface ReportColumns {
  options: ColumnOption[];
  visible: ReportColumnId[];
  toggle: (id: string, checked: boolean) => void;
  checkAll: () => void;
}

const ALL_SHOWN: ColumnOption[] = REPORT_COLUMN_IDS.map((id) => ({
  id,
  checked: true,
}));

/** Which columns the table and the CSV export show; all at first. */
export const useReportColumns = (): ReportColumns => {
  const [options, setOptions] = useState<ColumnOption[]>(ALL_SHOWN);

  const toggle = useCallback(
    (id: string, checked: boolean) =>
      setOptions((current) =>
        current.map((option) =>
          option.id === id ? { ...option, checked } : option,
        ),
      ),
    [],
  );
  const checkAll = useCallback(() => setOptions(ALL_SHOWN), []);

  return {
    options,
    visible: options
      .filter((option) => option.checked)
      .map((option) => option.id as ReportColumnId),
    toggle,
    checkAll,
  };
};
