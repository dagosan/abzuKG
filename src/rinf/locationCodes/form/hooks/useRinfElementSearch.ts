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

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildOperationalPointSearchQuery,
  MIN_SEARCH_LENGTH,
} from "../../../api/operationalPointSearchQuery";
import { todayIsoDate } from "../../../api/queryParts";
import { buildSectionOfLineSearchQuery } from "../../../api/sectionOfLineSearchQuery";
import { runSparqlSelect } from "../../../api/sparqlClient";
import { useRinfSparqlEndpoint } from "../../../config/rinfEndpoint";
import { toOperationalPointSearchResults } from "../../../models/OperationalPointSearchResult";
import {
  combineSearchResults,
  RinfSearchResult,
} from "../../../models/RinfSearchResult";
import { toSectionOfLineSearchResults } from "../../../models/SectionOfLineSearchResult";
import type { RinfLoadStatus } from "../../../state/loadStatus";

const RESULTS_LIMIT = 15;

export interface RinfElementSearch {
  status: RinfLoadStatus;
  results: RinfSearchResult[];
  /** Searches OPs and sections of line for the text (~3 s). */
  search: (text: string) => void;
}

/**
 * The header's RINF search, run locally for a form field: it does not
 * disturb the header's own results.
 */
export const useRinfElementSearch = (): RinfElementSearch => {
  const endpoint = useRinfSparqlEndpoint();
  const [status, setStatus] = useState<RinfLoadStatus>("idle");
  const [results, setResults] = useState<RinfSearchResult[]>([]);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length < MIN_SEARCH_LENGTH) return;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("loading");
      const validOn = todayIsoDate();
      Promise.allSettled([
        runSparqlSelect(
          endpoint,
          buildOperationalPointSearchQuery(trimmed, RESULTS_LIMIT, validOn),
          controller.signal,
        ).then(toOperationalPointSearchResults),
        runSparqlSelect(
          endpoint,
          buildSectionOfLineSearchQuery(trimmed, RESULTS_LIMIT, validOn),
          controller.signal,
        ).then(toSectionOfLineSearchResults),
      ]).then(([operationalPoints, sectionsOfLine]) => {
        if (controller.signal.aborted) return;
        const bothFailed =
          operationalPoints.status === "rejected" &&
          sectionsOfLine.status === "rejected";
        setStatus(bothFailed ? "failed" : "loaded");
        setResults(
          combineSearchResults(
            operationalPoints.status === "fulfilled"
              ? operationalPoints.value
              : [],
            sectionsOfLine.status === "fulfilled" ? sectionsOfLine.value : [],
          ),
        );
      });
    },
    [endpoint],
  );

  return { status, results, search };
};
