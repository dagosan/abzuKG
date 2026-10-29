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

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import type { PlaceMatch } from "../../models/parameterMatches";
import { sortPlaces } from "../reportColumns";

/** Rows per page: enough to scan, few enough to stay quick with 5,000 results. */
export const REPORT_PAGE_SIZE = 50;

export interface ReportRows {
  /** Every result, sorted, for the export. */
  all: PlaceMatch[];
  /** The results on the current page. */
  page: PlaceMatch[];
  pageIndex: number;
  pageCount: number;
  setPageIndex: (pageIndex: number) => void;
}

/** The report's results, sorted by name, a page at a time; a new search starts at page 1. */
export const useReportRows = (): ReportRows => {
  const { places, resultsKey } = useAppSelector(
    (state) => state.rinf.parameterSearch,
  );
  const [pageIndex, setPageIndex] = useState(0);
  const all = useMemo(() => sortPlaces(places), [places]);

  useEffect(() => setPageIndex(0), [resultsKey]);

  const start = pageIndex * REPORT_PAGE_SIZE;
  return {
    all,
    page: all.slice(start, start + REPORT_PAGE_SIZE),
    pageIndex,
    pageCount: Math.ceil(all.length / REPORT_PAGE_SIZE),
    setPageIndex,
  };
};
